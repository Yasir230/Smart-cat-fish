/*
 * ============================================================
 *  Smart Catfish Pond — DO-Risk Monitor with LED Aerator Indicator
 *  + Buzzer Alert System (Risk-Adaptive, Non-Blocking)
 *  + Firebase Realtime Database Integration (v4.0)
 *  Target MCU : ESP32-S3 (AI / N16R8 variant)
 *  IDE        : Arduino IDE 2.x  +  esp32 board package ≥ 3.x
 * ------------------------------------------------------------
 *  PIN MAP (v4.0 — tidak berubah dari v3.1)
 *   LM35DZ OUT   → GPIO1  (ADC1_CH0)
 *   Water Level  → GPIO2  (ADC1_CH1)
 *   LDR mid-pt   → GPIO3  (ADC1_CH2)
 *   LED (+)      → GPIO10 [220Ω → LED(+) → LED(−) → GND]
 *   Buzzer (+)   → GPIO11
 *   LCD SDA      → GPIO8
 *   LCD SCL      → GPIO9
 *
 * ------------------------------------------------------------
 *  Library yang harus diinstall via Library Manager:
 *   1. LiquidCrystal_I2C   by Frank de Brabander
 *   2. Firebase ESP Client  by Mobizt  ← cari "Firebase ESP Client"
 *   3. TensorFlowLite_ESP32            ← untuk fitur AI (opsional)
 *
 * ------------------------------------------------------------
 *  FIREBASE SETUP:
 *   Database URL : https://smart-edge-ai-catfish-default-rtdb
 *                  .asia-southeast1.firebasedatabase.app
 *   Auth         : Anonymous Sign-Up (otomatis saat boot)
 *
 *   Pastikan Firebase RTDB Rules di-set ke:
 *   {
 *     "rules": {
 *       ".read": "auth != null",
 *       ".write": "auth != null"
 *     }
 *   }
 *   (atau ".read": true, ".write": true untuk development)
 *
 * ------------------------------------------------------------
 *  STRUKTUR DATA DI FIREBASE RTDB:
 *
 *   /catfish/latest/
 *     ├── suhu          → float   (°C)
 *     ├── waterPct      → int     (0–100 %)
 *     ├── ldrPct        → int     (0–100 %)
 *     ├── doRisk        → int     (0–8)
 *     ├── doPredicted   → float   (mg/L, jika AI aktif)
 *     ├── aeratorOn     → bool
 *     ├── buzzerMode    → int     (0=SILENT, 1=SLOW, 2=FAST, 3=CONT)
 *     ├── mode          → string  ("AI" / "RuleBased")
 *     └── timestamp     → string  (WIB — dari NTP)
 *
 *   /catfish/alert/
 *     ├── active        → bool
 *     ├── riskScore     → int
 *     ├── message       → string
 *     └── timestamp     → string
 *
 * ============================================================
 *  LOGIKA BUZZER (tidak berubah):
 *   Score 0–2 → SILENT       | Score 3–4 → SLOW BEEP  (1200 Hz)
 *   Score 5–6 → FAST BEEP    | Score 7–8 → CONTINUOUS (3000 Hz)
 * ============================================================
 */

// ── Core Library ────────────────────────────────────────────
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ── AI/TFLite Micro ─────────────────────────────────────────
#define AI_ENABLED
#ifdef AI_ENABLED
  #include <TensorFlowLite_ESP32.h>
  #include "tensorflow/lite/micro/micro_error_reporter.h"
  #include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
  #include "tensorflow/lite/micro/micro_interpreter.h"
  #include "tensorflow/lite/schema/schema_generated.h"
  #include "do_model_data.h"    // file model kamu
  #include "do_norm_params.h"   // TEMP_MIN/MAX, WL_MIN/MAX, LDR_MIN/MAX, DO_MIN/MAX
#endif

// ── Firebase (menggantikan Blynk) ───────────────────────────
#define FIREBASE_ENABLED

#ifdef FIREBASE_ENABLED
  #include <WiFi.h>
  #include <Firebase_ESP_Client.h>
  // Dua header pembantu dari library Mobizt (ada di folder library):
  #include "addons/TokenHelper.h"   // tokenStatusCallback
  #include "addons/RTDBHelper.h"    // printResult (opsional)
  #include <time.h>                 // NTP timestamp

  // ── Kredensial WiFi & Firebase ──────────────────────────
  #define WIFI_SSID       "MauYah"
  #define WIFI_PASS       "RenDover123"
  #define FB_API_KEY      "AIzaSyD7NWHpija70_7X7cykQF8JwRf7Uv62w0s"
  #define FB_DATABASE_URL "https://smart-edge-ai-catfish-default-rtdb.asia-southeast1.firebasedatabase.app"

  // NTP — UTC+7 (WIB)
  #define NTP_GMT_OFFSET_SEC  (7 * 3600)
  #define NTP_DAYLIGHT_SEC    0
  #define NTP_SERVER1         "pool.ntp.org"
  #define NTP_SERVER2         "time.nist.gov"

  FirebaseData   fbdo;
  FirebaseAuth   fbAuth;
  FirebaseConfig fbConfig;

  bool g_signupOk      = false;   // anonymous auth berhasil
  bool g_fbReady       = false;   // Firebase.ready() pernah true
  bool g_alertSent     = false;   // edge-trigger alert
#endif

// ── Pin Definitions ─────────────────────────────────────────
// ✅ SAMA PERSIS dengan v3.1 — tidak ada yang berubah
#define PIN_LM35      1   // ADC1_CH0 — Suhu air (LM35DZ)
#define PIN_WATER     2   // ADC1_CH1 — Level air
#define PIN_LDR       3   // ADC1_CH2 — Intensitas cahaya
#define PIN_LED       10  // HIGH=LED ON | LOW=LED OFF (aktif-HIGH)
#define PIN_BUZZER    11  // PWM buzzer

// ── LCD ─────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── Threshold & Interval ────────────────────────────────────
const int           RISK_ON_THRESHOLD   = 5;
const int           RISK_OFF_THRESHOLD  = 3;
const unsigned long SAFE_CONFIRM_MS     = 600000UL; // 10 menit

const unsigned long READ_INTERVAL       = 5000UL;   // baca sensor
const unsigned long FIREBASE_INTERVAL   = 15000UL;  // kirim Firebase

// ── Global State ────────────────────────────────────────────
float  g_suhu        = 0.0;
int    g_waterRaw    = 0;
int    g_ldrRaw      = 0;
int    g_doRisk      = 0;
float  g_doPredicted = 0.0;
bool   g_aeratorOn   = false;
bool   g_aiActive    = false;
unsigned long g_safeSince    = 0;
unsigned long g_lastRead     = 0;
unsigned long g_lastFirebase = 0;

typedef enum {
  BUZZ_SILENT     = 0,
  BUZZ_SLOW       = 1,
  BUZZ_FAST       = 2,
  BUZZ_CONTINUOUS = 3
} BuzzerMode;

BuzzerMode    g_buzzerMode = BUZZ_SILENT;
unsigned long g_bzTimer    = 0;
int           g_bzPhase    = 0;

#define FREQ_SLOW          1200
#define FREQ_FAST          2000
#define FREQ_CONTINUOUS    3000
#define SLOW_BEEP_ON_MS     250
#define SLOW_BEEP_OFF_MS   2750
#define FAST_BEEP_ON_MS     100
#define FAST_BEEP_GAP_MS    100
#define FAST_BEEP_OFF_MS    700

// ============================================================
//  AI — TFLite Micro (tidak berubah dari v3.1)
// ============================================================
#ifdef AI_ENABLED

constexpr int kTensorArenaSize = 16 * 1024;
alignas(16) uint8_t tensor_arena[kTensorArenaSize];

const tflite::Model*      ai_model       = nullptr;
tflite::MicroInterpreter* ai_interpreter = nullptr;
TfLiteTensor*             ai_input       = nullptr;
TfLiteTensor*             ai_output      = nullptr;

float aiNormalize(float val, float mn, float mx)   { return (val - mn) / (mx - mn); }
float aiDenormalize(float val, float mn, float mx) { return val * (mx - mn) + mn;   }

int doToRiskScore(float do_mg_l) {
  if (do_mg_l >= 7.0) return 0;
  if (do_mg_l >= 6.5) return 1;
  if (do_mg_l >= 6.0) return 2;
  if (do_mg_l >= 5.5) return 3;
  if (do_mg_l >= 5.0) return 4;
  if (do_mg_l >= 4.0) return 5;
  if (do_mg_l >= 3.0) return 6;
  if (do_mg_l >= 2.0) return 7;
  return 8;
}

bool setupAI() {
  Serial.println("[AI] Memuat model TFLite...");
  ai_model = tflite::GetModel(do_model_data);
  if (ai_model->version() != TFLITE_SCHEMA_VERSION) {
    Serial.println("[AI] ERROR: Schema version mismatch!");
    return false;
  }

  static tflite::MicroMutableOpResolver<6> resolver;
  resolver.AddFullyConnected();
  resolver.AddRelu();
  resolver.AddQuantize();
  resolver.AddDequantize();
  resolver.AddReshape();

  static tflite::MicroInterpreter static_interpreter(
    ai_model, resolver, tensor_arena, kTensorArenaSize, tflite::GetMicroErrorReporter());
  ai_interpreter = &static_interpreter;

  if (ai_interpreter->AllocateTensors() != kTfLiteOk) {
    Serial.println("[AI] ERROR: AllocateTensors() gagal!");
    return false;
  }
  ai_input  = ai_interpreter->input(0);
  ai_output = ai_interpreter->output(0);
  Serial.printf("[AI] Siap. Arena used: %d bytes\n", ai_interpreter->arena_used_bytes());
  return true;
}

float predictDO(float suhu, float waterPct, float ldrPct) {
  ai_input->data.f[0] = aiNormalize(suhu,     TEMP_MIN, TEMP_MAX);
  ai_input->data.f[1] = aiNormalize(waterPct, WL_MIN,   WL_MAX);
  ai_input->data.f[2] = aiNormalize(ldrPct,   LDR_MIN,  LDR_MAX);

  unsigned long t0 = micros();
  if (ai_interpreter->Invoke() != kTfLiteOk) {
    Serial.println("[AI] ERROR: Invoke() gagal!"); return -1.0;
  }
  float do_pred = aiDenormalize(ai_output->data.f[0], DO_MIN, DO_MAX);
  do_pred = constrain(do_pred, 0.0, 14.0);
  Serial.printf("[AI] Inference: %lu us | DO = %.2f mg/L\n", micros()-t0, do_pred);
  return do_pred;
}
#endif // AI_ENABLED

// ============================================================
//  FIREBASE — WiFi + RTDB (menggantikan Blynk)
// ============================================================
#ifdef FIREBASE_ENABLED

// Ambil timestamp WIB dari NTP (fallback ke "no-sync" jika NTP gagal)
String getTimestamp() {
  time_t now; time(&now);
  if (now < 1000000UL) return "NTP-not-synced";
  struct tm ti; localtime_r(&now, &ti);
  char buf[24];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &ti);
  return String(buf);
}

void initFirebase() {
  // ── 1. Connect WiFi (max 15 detik) ──────────────────────
  Serial.printf("[WiFi] Connecting ke %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(300); Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] GAGAL — Firebase offline. Tetap jalan rule-based.");
    return;
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  // ── 2. NTP Time Sync ────────────────────────────────────
  configTime(NTP_GMT_OFFSET_SEC, NTP_DAYLIGHT_SEC, NTP_SERVER1, NTP_SERVER2);
  Serial.print("[NTP] Sync");
  for (int i = 0; i < 12; i++) {
    time_t n; time(&n);
    if (n > 1000000UL) break;
    delay(500); Serial.print(".");
  }
  Serial.printf(" → %s\n", getTimestamp().c_str());

  // ── 3. Firebase Anonymous Auth ───────────────────────────
  // Tiap reset akan buat anonymous user baru di Firebase.
  // Untuk produksi, simpan refresh token di NVS/Preferences.
  fbConfig.api_key      = FB_API_KEY;
  fbConfig.database_url = FB_DATABASE_URL;

  if (Firebase.signUp(&fbConfig, &fbAuth, "", "")) {
    Serial.println("[Firebase] Anonymous auth BERHASIL");
    g_signupOk = true;
  } else {
    Serial.printf("[Firebase] Auth GAGAL: %s\n",
                  fbConfig.signer.signupError.message.c_str());
    return;
  }

  // callback info token refresh (dari addons/TokenHelper.h)
  fbConfig.token_status_callback = tokenStatusCallback;

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectNetwork(true);  // auto-reconnect WiFi

  // Atur buffer SSL (PENTING: Diperbesar untuk ESP32-S3 agar sertifikat Google tidak timeout)
  fbdo.setResponseSize(8192);
  fbdo.setBSSLBufferSize(16384, 4096);
  fbConfig.timeout.socketConnection = 10000; // Tambah waktu tunggu koneksi jadi 10 detik

  Serial.println("[Firebase] Inisialisasi selesai.");
}

void kirimFirebase(float suhu, int waterPct, int ldrPct, int riskScore) {
  if (!g_signupOk || !Firebase.ready()) {
    Serial.println("[Firebase] Tidak siap — skip kirim.");
    return;
  }

  // ── Kirim data sensor ke /catfish/latest ────────────────
  FirebaseJson json;
  json.set("suhu",        suhu);
  json.set("waterPct",    waterPct);
  json.set("ldrPct",      ldrPct);
  json.set("doRisk",      riskScore);
  json.set("aeratorOn",   g_aeratorOn);
  json.set("buzzerMode",  (int)g_buzzerMode);
  json.set("timestamp",   getTimestamp());

#ifdef AI_ENABLED
  if (g_aiActive && g_doPredicted >= 0.0) {
    json.set("doPredicted", g_doPredicted);
    json.set("mode", "AI");
  } else {
    json.set("mode", "RuleBased");
  }
#else
  json.set("mode", "RuleBased");
#endif

  if (Firebase.RTDB.setJSON(&fbdo, "/catfish/latest", &json)) {
    Serial.println("[Firebase] ✓ /catfish/latest updated");
  } else {
    Serial.printf("[Firebase] ✗ Error: %s\n", fbdo.errorReason().c_str());
  }

  // ── Alert — edge-triggered (tidak spam Firebase) ─────────
  // Kirim alert sekali saat risk naik ke ≥ 5, clear saat turun
  if (riskScore >= RISK_ON_THRESHOLD) {
    if (!g_alertSent) {
      FirebaseJson alertJson;
      alertJson.set("active",    true);
      alertJson.set("riskScore", riskScore);
      alertJson.set("message",   "DO-Risk kritis! LED aerator menyala.");
      alertJson.set("timestamp", getTimestamp());

      if (Firebase.RTDB.setJSON(&fbdo, "/catfish/alert", &alertJson)) {
        Serial.println("[Firebase] ⚠ Alert terkirim!");
      }
      g_alertSent = true;
    }
  } else {
    if (g_alertSent) {
      Firebase.RTDB.setBool(&fbdo, "/catfish/alert/active", false);
      g_alertSent = false;
      Serial.println("[Firebase] ✓ Alert cleared.");
    }
  }
}

#endif // FIREBASE_ENABLED

// ============================================================
//  BUZZER STATE MACHINE (non-blocking — tidak berubah)
// ============================================================
void setBuzzerMode(BuzzerMode newMode) {
  if (newMode == g_buzzerMode) return;
  g_buzzerMode = newMode;
  g_bzTimer    = millis();
  g_bzPhase    = 0;
  noTone(PIN_BUZZER);
}

void updateBuzzerFromRisk(int score) {
  if      (score >= 7) setBuzzerMode(BUZZ_CONTINUOUS);
  else if (score >= 5) setBuzzerMode(BUZZ_FAST);
  else if (score >= 3) setBuzzerMode(BUZZ_SLOW);
  else                 setBuzzerMode(BUZZ_SILENT);
}

void handleBuzzer() {
  unsigned long now = millis();
  unsigned long dt  = now - g_bzTimer;

  switch (g_buzzerMode) {
    case BUZZ_SILENT: break;
    case BUZZ_CONTINUOUS: tone(PIN_BUZZER, FREQ_CONTINUOUS); break;

    case BUZZ_SLOW:
      if      (g_bzPhase == 0 && dt >= SLOW_BEEP_OFF_MS) {
        tone(PIN_BUZZER, FREQ_SLOW); g_bzPhase = 1; g_bzTimer = now;
      } else if (g_bzPhase == 1 && dt >= SLOW_BEEP_ON_MS) {
        noTone(PIN_BUZZER);          g_bzPhase = 0; g_bzTimer = now;
      }
      break;

    case BUZZ_FAST:
      switch (g_bzPhase) {
        case 0: if (dt >= FAST_BEEP_OFF_MS) { tone(PIN_BUZZER, FREQ_FAST); g_bzPhase=1; g_bzTimer=now; } break;
        case 1: if (dt >= FAST_BEEP_ON_MS)  { noTone(PIN_BUZZER);           g_bzPhase=2; g_bzTimer=now; } break;
        case 2: if (dt >= FAST_BEEP_GAP_MS) { tone(PIN_BUZZER, FREQ_FAST); g_bzPhase=3; g_bzTimer=now; } break;
        case 3: if (dt >= FAST_BEEP_ON_MS)  { noTone(PIN_BUZZER);           g_bzPhase=0; g_bzTimer=now; } break;
      }
      break;
  }
}

void startupBeep() {
  tone(PIN_BUZZER, 1500); delay(100); noTone(PIN_BUZZER); delay(80);
  tone(PIN_BUZZER, 1500); delay(100); noTone(PIN_BUZZER);
}

// ============================================================
//  SENSOR FUNCTIONS (tidak berubah)
// ============================================================
float bacaSuhu() {
  long sum = 0;
  for (int i = 0; i < 10; i++) { sum += analogReadMilliVolts(PIN_LM35); delayMicroseconds(500); }
  return (sum / 10.0) / 10.0;
}

int bacaWaterLevel() {
  long sum = 0;
  for (int i = 0; i < 5; i++) { sum += analogRead(PIN_WATER); delay(2); }
  g_waterRaw = sum / 5;
  return map(constrain(g_waterRaw, 0, 3000), 0, 3000, 0, 100);
}

int bacaLDR() {
  long sum = 0;
  for (int i = 0; i < 5; i++) { sum += analogRead(PIN_LDR); delay(2); }
  g_ldrRaw = sum / 5;
  return map(constrain(g_ldrRaw, 0, 4095), 0, 4095, 0, 100);
}

int hitungDORiskRuleBased(float suhu, int waterPct, int ldrPct) {
  int score = 0;
  if      (suhu     >= 32.0) score += 3;
  else if (suhu     >= 30.0) score += 2;
  else if (suhu     >= 28.0) score += 1;
  if      (waterPct <  20)   score += 3;
  else if (waterPct <  40)   score += 1;
  if      (ldrPct   <  10)   score += 2;
  else if (ldrPct   <  30)   score += 1;
  return constrain(score, 0, 8);
}

int hitungDORisk(float suhu, int waterPct, int ldrPct) {
#ifdef AI_ENABLED
  if (g_aiActive) {
    float do_val = predictDO(suhu, (float)waterPct, (float)ldrPct);
    if (do_val >= 0) { g_doPredicted = do_val; return doToRiskScore(do_val); }
    Serial.println("[AI] Fallback ke rule-based.");
  }
#endif
  g_doPredicted = -1.0;
  return hitungDORiskRuleBased(suhu, waterPct, ldrPct);
}

// ── Kontrol LED Aerator dengan Hysteresis ───────────────────
void kontrolAerator(int riskScore) {
  unsigned long now = millis();
  if (!g_aeratorOn && riskScore >= RISK_ON_THRESHOLD) {
    g_aeratorOn = true; g_safeSince = 0;
    digitalWrite(PIN_LED, HIGH);
    Serial.println("[LED] ON — DO-Risk kritis! Aerator aktif.");
  }
  else if (g_aeratorOn && riskScore < RISK_OFF_THRESHOLD) {
    if (g_safeSince == 0) {
      g_safeSince = now;
      Serial.println("[LED] Kondisi membaik, mulai hitung 10 menit aman...");
    } else if ((now - g_safeSince) >= SAFE_CONFIRM_MS) {
      g_aeratorOn = false; g_safeSince = 0;
      digitalWrite(PIN_LED, LOW);
      Serial.println("[LED] OFF — Aman selama 10 menit.");
    }
  } else {
    if (riskScore >= RISK_OFF_THRESHOLD) g_safeSince = 0;
  }
}

// ── LCD ─────────────────────────────────────────────────────
void tampilLCD(float suhu, int waterPct, int ldrPct, int riskScore) {
  lcd.setCursor(0, 0);
#ifdef AI_ENABLED
  if (g_aiActive && g_doPredicted >= 0) {
    lcd.print("DO:"); lcd.print(g_doPredicted, 1);
    lcd.print("mg T:"); lcd.print(suhu, 0); lcd.print("  ");
  } else {
#endif
    lcd.print("T:"); lcd.print(suhu, 1); lcd.print((char)223);
    lcd.print("C L:"); lcd.print(waterPct); lcd.print("% ");
#ifdef AI_ENABLED
  }
#endif
  lcd.setCursor(0, 1);
  lcd.print("Risk:"); lcd.print(riskScore); lcd.print("/8 ");
  if      (riskScore >= 7) lcd.print("[ALARM]");
  else if (riskScore >= 5) lcd.print("[KRIT] ");
  else if (riskScore >= 3) lcd.print("[WASPD]");
  else                     lcd.print("[AMAN] ");
}

// ── Serial Debug ─────────────────────────────────────────────
void printDebug(float suhu, int waterPct, int ldrPct, int riskScore) {
  const char* bzLabel[] = {"SILENT","SLOW-BEEP","FAST-BEEP","CONTINUOUS"};
  const char* riskLabel;
  if      (riskScore >= 7) riskLabel = "SANGAT KRITIS !!!";
  else if (riskScore >= 5) riskLabel = "KRITIS";
  else if (riskScore >= 3) riskLabel = "WASPADA";
  else                     riskLabel = "AMAN";

  Serial.println("──────────────────────────────────");
  Serial.printf("Suhu Air   : %.1f C\n",         suhu);
  Serial.printf("Level Air  : %d%% (raw: %d)\n", waterPct, g_waterRaw);
  Serial.printf("Cahaya LDR : %d%% (raw: %d)\n", ldrPct,   g_ldrRaw);
#ifdef AI_ENABLED
  if (g_aiActive && g_doPredicted >= 0)
    Serial.printf("DO Prediksi: %.2f mg/L [AI]\n", g_doPredicted);
  Serial.printf("Mode       : %s\n", g_aiActive ? "AI (TFLite)" : "Rule-Based");
#else
  Serial.println("Mode       : Rule-Based (AI disabled)");
#endif
  Serial.printf("DO-Risk    : %d/8  [%s]\n",   riskScore, riskLabel);
  Serial.printf("LED        : %s\n",            g_aeratorOn ? "ON  [NYALA]" : "OFF [MATI]");
  Serial.printf("Buzzer     : %s\n",            bzLabel[g_buzzerMode]);
#ifdef FIREBASE_ENABLED
  Serial.printf("Firebase   : %s | WiFi: %s\n",
    (Firebase.ready() && g_signupOk) ? "ONLINE" : "OFFLINE",
    WiFi.status() == WL_CONNECTED    ? WiFi.localIP().toString().c_str() : "disconnected");
#endif
  Serial.println("──────────────────────────────────");
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== Smart Catfish DO-Risk Monitor ===");
  Serial.println("ESP32-S3 | v4.0 — Firebase Edition (Blynk → Firebase)");

  // GPIO init
  pinMode(PIN_LED,    OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED, LOW);   // LED OFF saat start (aktif-HIGH)

  // ADC
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // I2C → LCD
  Wire.begin(8, 9);

  // I2C Scanner
  Serial.println("I2C Scanner:");
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0)
      Serial.printf("  Found: 0x%02X\n", addr);
  }

  // LCD splash
  lcd.init(); lcd.backlight(); lcd.clear();
  lcd.setCursor(0, 0); lcd.print("SmartCatfish v4 ");
  lcd.setCursor(0, 1); lcd.print("Firebase Edition");
  delay(2000); lcd.clear();

  startupBeep();

  g_buzzerMode = BUZZ_SILENT;
  g_bzTimer    = millis();
  g_bzPhase    = 0;

  // LED test blink 2x
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_LED, HIGH); delay(200);
    digitalWrite(PIN_LED, LOW);  delay(200);
  }
  Serial.println("[LED] Test OK. GPIO10 aktif-HIGH.");

  // AI init
#ifdef AI_ENABLED
  g_aiActive = setupAI();
  if (g_aiActive) {
    Serial.println("[AI] Neural Network AKTIF!");
    tone(PIN_BUZZER, 2000); delay(80); noTone(PIN_BUZZER); delay(60);
    tone(PIN_BUZZER, 2500); delay(120); noTone(PIN_BUZZER);
  } else {
    Serial.println("[AI] Gagal → fallback rule-based.");
  }
#else
  Serial.println("[AI] AI tidak dikompilasi → rule-based.");
#endif

  // Firebase init (WiFi + NTP + auth)
#ifdef FIREBASE_ENABLED
  initFirebase();
  lcd.clear();
  lcd.setCursor(0, 0);
  if (g_signupOk) {
    lcd.print("Firebase: OK    ");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
  } else {
    lcd.print("Firebase: OFFLINE");
    lcd.setCursor(0, 1);
    lcd.print("Rule-based mode ");
  }
  delay(2000); lcd.clear();
#endif

  Serial.println("Monitoring dimulai!");
  Serial.printf("Read: %lus | Firebase: %lus\n",
                READ_INTERVAL / 1000, FIREBASE_INTERVAL / 1000);
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  unsigned long now = millis();

  // ── 1. Buzzer state machine (SETIAP iterasi — non-blocking) ─
  handleBuzzer();

  // ── 2. Baca sensor setiap READ_INTERVAL ──────────────────
  if (now - g_lastRead >= READ_INTERVAL) {
    g_lastRead = now;

    g_suhu       = bacaSuhu();
    int waterPct = bacaWaterLevel();
    int ldrPct   = bacaLDR();
    g_doRisk     = hitungDORisk(g_suhu, waterPct, ldrPct);

    updateBuzzerFromRisk(g_doRisk);
    kontrolAerator(g_doRisk);
    tampilLCD(g_suhu, waterPct, ldrPct, g_doRisk);
    printDebug(g_suhu, waterPct, ldrPct, g_doRisk);

    // ── 3. Kirim ke Firebase setiap FIREBASE_INTERVAL ──────
#ifdef FIREBASE_ENABLED
    if (now - g_lastFirebase >= FIREBASE_INTERVAL) {
      g_lastFirebase = now;
      kirimFirebase(g_suhu, waterPct, ldrPct, g_doRisk);
    }
#endif
  }
}

/*
 * ============================================================
 *  RINGKASAN PERUBAHAN v3.1 → v4.0 (Firebase Edition)
 * ============================================================
 *
 *  Yang DIHAPUS:
 *   - #define BLYNK_TEMPLATE_ID / BLYNK_TEMPLATE_NAME / BLYNK_AUTH_TOKEN
 *   - #include <BlynkSimpleEsp32.h>
 *   - Blynk.config(), Blynk.run(), Blynk.virtualWrite(), Blynk.logEvent()
 *   - g_lastBlynk, g_blynkAlertSent
 *
 *  Yang DITAMBAHKAN:
 *   - #include <Firebase_ESP_Client.h>  + addons/TokenHelper.h
 *   - FirebaseData, FirebaseAuth, FirebaseConfig
 *   - initFirebase()  → WiFi + NTP + anonymous signUp
 *   - kirimFirebase() → setJSON ke /catfish/latest + /catfish/alert
 *   - getTimestamp()  → waktu WIB dari NTP
 *
 *  Yang SAMA PERSIS (tidak berubah):
 *   - Semua PIN (GPIO1,2,3,10,11,8,9)
 *   - AI TFLite inference
 *   - Buzzer state machine
 *   - Sensor functions (bacaSuhu, bacaWaterLevel, bacaLDR)
 *   - kontrolAerator() hysteresis logic
 *   - tampilLCD(), printDebug()
 *   - Loop structure
 *
 * ============================================================
 *  SETUP FIREBASE RTDB RULES (penting!):
 *
 *  Buka Firebase Console → Realtime Database → Rules
 *  Paste ini (untuk development):
 *  {
 *    "rules": {
 *      ".read": true,
 *      ".write": true
 *    }
 *  }
 *
 *  Untuk production (lebih aman):
 *  {
 *    "rules": {
 *      ".read": "auth != null",
 *      ".write": "auth != null"
 *    }
 *  }
 *
 * ============================================================
 *  CATATAN LIBRARY:
 *
 *  Library Manager → cari "Firebase ESP Client" by Mobizt
 *  Bukan "FirebaseArduino" yang lama — pastikan by Mobizt!
 *
 *  Setelah install, cek folder library kamu:
 *    .../libraries/Firebase_ESP_Client/src/addons/TokenHelper.h
 *    .../libraries/Firebase_ESP_Client/src/addons/RTDBHelper.h
 *  Kedua file itu HARUS ada untuk kompilasi berhasil.
 * ============================================================
 */

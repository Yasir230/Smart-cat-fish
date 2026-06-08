# 🐟 Smart Catfish Dashboard

Real-time IoT dashboard for catfish pond Dissolved Oxygen (DO) monitoring using Edge AI. 

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-RTDB-ffca28)

## 📖 Overview
This dashboard acts as the visualization and control interface for an Arduino ESP32-based Smart Catfish Pond system. It visualizes data from sensors (LM35, Water Level, LDR) and displays Dissolved Oxygen levels predicted by a TensorFlow Lite Edge AI model, eliminating the need for expensive electrochemical DO sensors.

This project is built based on the research paper: **"Pemantauan Risiko Dissolved Oxygen Berbasis Edge AI Tanpa Sensor Elektrokimia dengan Aerator Otomatis untuk Budidaya Lele Berbiaya Rendah"**.

## 🏗 Architecture
```text
[ESP32-S3 + TFLite] ---> (Every 15s) ---> [Firebase RTDB] <=== (Real-time Sync) ===> [Next.js Dashboard]
       |                                                                                    |
       v                                                                                    v
[Sensors: LM35, WL, LDR]                                                              [Vercel CDN]
[Controls: LED Aerator, Buzzer]
```

## ✨ Features (6-Panel Dashboard)
1. **DO Monitor**: Real-time Dissolved Oxygen gauge with 60-minute sparkline and pulsing risk indicator.
2. **AI Risk Analyzer**: Confidence level of the Edge AI model, parameter breakdown, and 30-minute forecasting.
3. **Aerator Control**: Auto/Manual toggle for the aerator with safety rate-limiting and efficiency tracking.
4. **Data Charts**: 24h interactive charts for DO trends and Temperature correlation.
5. **Device Status**: Hardware online/offline status, WiFi signal, firmware version, and raw sensor logs.
6. **Alert Feed**: Rule-based notification system for critical drops in DO, complete with audio alerts.

## 🚀 Setup & Installation

1. Clone the repository:
```bash
git clone https://github.com/Yasir230/Smart-cat-fish.git
cd serene-bell
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
Create a `.env.local` file in the root directory based on `.env.example` with your Firebase credentials.

4. Run the development server:
```bash
npm run dev
```

## 🗄️ Firebase RTDB Schema
The dashboard expects the following structure from the ESP32:
```json
{
  "catfish": {
    "latest": {
      "suhu": 28.5,
      "waterPct": 85,
      "ldrPct": 60,
      "doRisk": 3,
      "doPredicted": 5.8,
      "aeratorOn": false,
      "buzzerMode": 0,
      "mode": "AI",
      "timestamp": "2026-06-08 14:00:00"
    },
    "alert": {
      "active": false,
      "riskScore": 3,
      "message": "Kondisi waspada, DO terpantau 5.8 mg/L.",
      "timestamp": "2026-06-08 14:00:00"
    }
  }
}
```

## 🌐 Deployment
This project is configured for **Static Export** (`output: 'export'` in `next.config.ts`), making it highly performant and ready to be deployed on Vercel or GitHub Pages. A GitHub Actions workflow `.github/workflows/deploy.yml` is included.

## 📄 License
MIT License

---
**Author**: Yaris Akbar Rivaldi

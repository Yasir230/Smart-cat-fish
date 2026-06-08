export const RISK_THRESHOLDS = {
  SAFE_MIN: 5.0,
  WARN_MIN: 3.0,
  CRIT_MIN: 2.0,
};

export const SENSOR_RANGES = {
  TEMP_MIN: 20,
  TEMP_MAX: 40,
  WATER_MIN: 0,
  WATER_MAX: 100,
  LDR_MIN: 0,
  LDR_MAX: 100,
  DO_MIN: 0,
  DO_MAX: 14,
};

export const CHART_COLORS = {
  safe: '#0ea5e9',
  warn: '#f59e0b',
  critical: '#ef4444',
  danger: '#b91c1c',
  temp: '#a855f7',
  water: '#3b82f6',
  ldr: '#eab308'
};

export const REFRESH_INTERVAL = 5000;
export const AERATOR_RATE_LIMIT = 5000;

export const FIREBASE_PATHS = {
  LATEST: '/catfish/latest',
  ALERT: '/catfish/alert'
};

export const BUZZER_MODES = ['SILENT', 'SLOW_BEEP', 'FAST_BEEP', 'CONTINUOUS'];

export interface SensorReading {
  suhu: number;
  waterPct: number;
  ldrPct: number;
  doRisk: number; // 0-8
  doPredicted: number; // mg/L, -1 if not available
  aeratorOn: boolean;
  buzzerMode: number; // 0-3
  mode: string; // "AI" or "RuleBased"
  timestamp: string;
}

export interface AlertData {
  active: boolean;
  riskScore: number;
  message: string;
  timestamp: string;
}

export interface DeviceStatus {
  online: boolean;
  lastSeen: number;
  wifiSignal: number;
  firmware: string;
  uptime: number;
}

export interface AeratorState {
  status: 'auto' | 'manual';
  isRunning: boolean;
  manualOverride: boolean;
  lastActivated: number;
  totalRuntimeToday: number;
  autoThreshold: number;
}

export type RiskLevel = 'safe' | 'warning' | 'critical' | 'danger';

export interface HistoryEntry {
  doRisk: number;
  doPredicted: number;
  suhu: number;
  waterPct: number;
  ldrPct: number;
  timestamp: string;
  aeratorOn: boolean;
}

export interface DashboardData {
  reading: SensorReading | null;
  alert: AlertData | null;
  history: HistoryEntry[];
}

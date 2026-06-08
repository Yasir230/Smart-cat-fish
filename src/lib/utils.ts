import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskScoreToLevel(score: number): RiskLevel {
  if (score >= 7) return 'danger';
  if (score >= 5) return 'critical';
  if (score >= 3) return 'warning';
  return 'safe';
}

export function riskScoreToLabel(score: number): string {
  if (score >= 7) return 'Sangat Kritis';
  if (score >= 5) return 'Kritis';
  if (score >= 3) return 'Waspada';
  return 'Aman';
}

export function riskScoreToColor(score: number): string {
  if (score >= 7) return 'text-accent-danger bg-accent-danger-bg border-accent-danger-border';
  if (score >= 5) return 'text-accent-critical bg-accent-critical-bg border-accent-critical-border';
  if (score >= 3) return 'text-accent-warn bg-accent-warn-bg border-accent-warn-border';
  return 'text-accent-safe bg-accent-safe-bg border-accent-safe-border';
}

// Approximate reverse mapping based on Arduino logic
export function doFromRiskScore(score: number): number {
  if (score >= 8) return 1.5;
  if (score >= 7) return 2.5;
  if (score >= 6) return 3.5;
  if (score >= 5) return 4.5;
  if (score >= 4) return 5.2;
  if (score >= 3) return 5.8;
  if (score >= 2) return 6.2;
  if (score >= 1) return 6.8;
  return 7.5;
}

export function formatTimestamp(timestamp: string): string {
  if (!timestamp || timestamp === "NTP-not-synced") return "Belum sinkron";
  // Assuming "YYYY-MM-DD HH:MM:SS" from Arduino
  const parts = timestamp.split(' ');
  if (parts.length !== 2) return timestamp;
  return parts[1]; // Return just the time for dashboard
}

export function buzzerModeLabel(mode: number): string {
  switch (mode) {
    case 0: return 'Silent';
    case 1: return 'Slow Beep';
    case 2: return 'Fast Beep';
    case 3: return 'Continuous';
    default: return 'Unknown';
  }
}

export function calculateAIConfidence(doRisk: number, mode: string): number {
  if (mode !== "AI") return 0;
  // Simulated confidence based on extremes (models usually less confident at extremes without lots of data)
  const base = 85;
  const variation = Math.abs(doRisk - 4) * 2.5; 
  return Math.min(98.5, Math.max(75.2, base - variation + (Math.random() * 3 - 1.5)));
}

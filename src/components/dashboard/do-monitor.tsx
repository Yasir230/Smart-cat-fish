'use client';

import { Activity } from 'lucide-react';
import { SensorReading, HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MetricGauge } from '@/components/ui/metric-gauge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { riskScoreToLabel, riskScoreToLevel } from '@/lib/utils';
import { SENSOR_RANGES } from '@/lib/constants';

interface DoMonitorProps {
  reading: SensorReading | null;
  history: HistoryEntry[];
  isLoading: boolean;
}

export function DoMonitor({ reading, history, isLoading }: DoMonitorProps) {
  if (isLoading || !reading) {
    return (
      <GlassPanel title="DO Monitor" icon={Activity}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <SkeletonLoader className="w-40 h-40 rounded-full" />
          <SkeletonLoader className="w-32 h-6 rounded-full" />
        </div>
      </GlassPanel>
    );
  }

  // Build sparkline data (last 12 readings)
  const sparklineData = history.slice(-12).map(h => h.doPredicted);
  const maxDO = Math.max(...sparklineData, 8); // Ensure some baseline max
  const minDO = Math.min(...sparklineData, 2); // Ensure some baseline min
  const range = maxDO - minDO || 1;
  
  // Create polyline points
  const points = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1 || 1)) * 100;
    const y = 100 - ((val - minDO) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const riskLevel = riskScoreToLevel(reading.doRisk);
  const statusLabel = riskScoreToLabel(reading.doRisk);
  const isPulse = reading.doRisk >= 5;

  return (
    <GlassPanel 
      title="DO Monitor" 
      icon={Activity}
      headerAction={<StatusBadge status={riskLevel} label={statusLabel} pulse={isPulse} />}
      className="md:col-span-1"
    >
      <div className="flex flex-col items-center justify-between h-full py-4">
        
        <div className="flex-1 flex items-center justify-center">
          <MetricGauge 
            value={reading.doPredicted} 
            max={SENSOR_RANGES.DO_MAX}
            label="Dissolved Oxygen"
            unit="mg/L"
            size="lg"
            riskScore={reading.doRisk}
            pulse={isPulse}
          />
        </div>

        <div className="w-full mt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/50 tracking-wider">TREN 60 MENIT</span>
            <span className="text-[10px] text-white/40">{sparklineData.length} sampel</span>
          </div>
          
          <div className="h-12 w-full relative group">
            {/* Sparkline background grid */}
            <div className="absolute inset-0 border-b border-l border-white/10" />
            <div className="absolute top-1/2 left-0 right-0 border-b border-white/5 border-dashed" />
            
            {sparklineData.length > 1 ? (
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Area fill */}
                <polygon 
                  points={`0,100 ${points} 100,100`} 
                  fill="url(#sparkline-gradient)" 
                  className="opacity-20"
                />
                {/* Line */}
                <polyline 
                  points={points} 
                  fill="none" 
                  stroke="var(--color-accent-safe)" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_5px_rgba(14,165,233,0.5)]"
                />
                <defs>
                  <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-safe)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--color-accent-safe)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-white/30">Mengumpulkan data...</span>
              </div>
            )}
            
            {/* Tooltip on hover (simple CSS) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm flex items-center justify-center rounded border border-white/10">
              <span className="text-xs font-mono">{reading.doPredicted.toFixed(2)} mg/L (Live)</span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

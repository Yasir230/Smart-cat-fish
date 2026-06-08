'use client';

import { BrainCircuit, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { SensorReading, HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { calculateAIConfidence, riskScoreToColor } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

interface RiskAnalyzerProps {
  reading: SensorReading | null;
  history: HistoryEntry[];
  isLoading: boolean;
}

export function RiskAnalyzer({ reading, history, isLoading }: RiskAnalyzerProps) {
  if (isLoading || !reading) {
    return (
      <GlassPanel title="AI Risk Analyzer" icon={BrainCircuit}>
        <div className="flex flex-col h-full gap-4">
          <SkeletonLoader className="w-full h-20 rounded-xl" />
          <SkeletonLoader className="w-full h-32 rounded-xl flex-1" />
        </div>
      </GlassPanel>
    );
  }

  const confidence = calculateAIConfidence(reading.doRisk, reading.mode);
  
  // Calculate trend from history
  let trendIcon = Minus;
  let trendColor = 'text-white/50';
  let forecast = "Kondisi stabil";
  
  if (history.length >= 2) {
    const latest = history[history.length - 1].doRisk;
    const previous = history[history.length - 2].doRisk;
    if (latest > previous) {
      trendIcon = TrendingUp; // Risk going up (bad)
      trendColor = 'text-red-400';
      forecast = "Risiko meningkat. Antisipasi DO drop dalam 30 menit.";
    } else if (latest < previous) {
      trendIcon = TrendingDown; // Risk going down (good)
      trendColor = 'text-emerald-400';
      forecast = "Kondisi membaik. Aerator efektif menaikkan DO.";
    }
  }

  return (
    <GlassPanel title="AI Risk Analyzer" icon={BrainCircuit} className="md:col-span-1">
      <div className="flex flex-col h-full space-y-6">
        
        {/* Confidence & Mode Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">ANALYSIS MODE</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", reading.mode === 'AI' ? "bg-purple-500 animate-pulse" : "bg-blue-500")} />
              <span className="font-medium text-white">{reading.mode === 'AI' ? 'Edge AI (TFLite)' : 'Rule-Based Logic'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">CONFIDENCE</p>
            <span className="text-xl font-mono font-bold text-sky-400">{confidence.toFixed(1)}%</span>
          </div>
        </div>

        {/* Risk Score Display */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-lg",
            riskScoreToColor(reading.doRisk)
          )}>
            <span className="text-3xl font-black">{reading.doRisk}</span>
            <span className="text-[10px] font-bold opacity-80">/ 8</span>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-2">Parameter Pemicu Risiko:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between bg-white/5 px-2 py-1.5 rounded">
                <span className="text-white/60">Suhu</span>
                <span className={reading.suhu > 30 ? "text-amber-400 font-medium" : "text-white"}>{reading.suhu.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between bg-white/5 px-2 py-1.5 rounded">
                <span className="text-white/60">Level Air</span>
                <span className={reading.waterPct < 40 ? "text-amber-400 font-medium" : "text-white"}>{reading.waterPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Chart & Forecast */}
        <div className="flex-1 flex flex-col justify-end mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/80">Prediksi 30 Menit</span>
            <trendIcon className={cn("w-4 h-4", trendColor)} />
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            {forecast}
          </p>
          
          {/* Simple Risk Trend Line */}
          <div className="h-10 w-full mt-3 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(-20)}>
                <YAxis domain={[0, 8]} hide />
                <Line 
                  type="monotone" 
                  dataKey="doRisk" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </GlassPanel>
  );
}

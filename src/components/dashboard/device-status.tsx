'use client';

import { Cpu, Wifi, Activity, Database, Clock } from 'lucide-react';
import { SensorReading, HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { cn, formatTimestamp } from '@/lib/utils';

interface DeviceStatusProps {
  reading: SensorReading | null;
  history: HistoryEntry[];
  isLoading: boolean;
}

export function DeviceStatus({ reading, history, isLoading }: DeviceStatusProps) {
  if (isLoading || !reading) {
    return (
      <GlassPanel title="Device Status" icon={Cpu}>
        <div className="flex flex-col h-full gap-4">
          <SkeletonLoader className="w-full h-12 rounded-xl" />
          <SkeletonLoader className="w-full h-32 rounded-xl flex-1" />
        </div>
      </GlassPanel>
    );
  }

  // Calculate simulated connection quality based on history updates
  const wifiStrength = 85; // Simulated percentage
  
  return (
    <GlassPanel title="Hardware & Network" icon={Cpu} className="md:col-span-1">
      <div className="flex flex-col h-full">
        
        {/* Device Metrics Row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Sinyal WiFi</p>
              <p className="text-sm font-semibold text-white">{wifiStrength}% <span className="text-emerald-400 text-xs font-normal ml-1">Kuat</span></p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Firmware</p>
              <p className="text-sm font-semibold text-white">v4.0 Firebase</p>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <Clock className="w-3 h-3 text-white/40" />
          <span className="text-xs text-white/60">Update terakhir: <span className="text-white font-medium">{formatTimestamp(reading.timestamp)}</span></span>
        </div>

        {/* Raw Sensor Table */}
        <div className="flex-1 overflow-hidden flex flex-col border border-white/10 rounded-xl bg-black/20">
          <div className="grid grid-cols-4 bg-white/5 p-2 text-[10px] uppercase tracking-wider font-semibold text-white/50 border-b border-white/10">
            <div className="col-span-1 pl-2">Time</div>
            <div className="col-span-1 text-center">Suhu</div>
            <div className="col-span-1 text-center">Level</div>
            <div className="col-span-1 text-center">LDR</div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 text-xs">
            {history.slice(-5).reverse().map((entry, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "grid grid-cols-4 p-2.5 border-b border-white/5 last:border-0 transition-colors",
                  idx === 0 ? "bg-sky-500/5" : ""
                )}
              >
                <div className="col-span-1 text-white/70 pl-2">{formatTimestamp(entry.timestamp).substring(0, 5)}</div>
                <div className={cn("col-span-1 text-center font-medium", entry.suhu > 30 ? "text-amber-400" : "text-white")}>
                  {entry.suhu.toFixed(1)}°
                </div>
                <div className={cn("col-span-1 text-center font-medium", entry.waterPct < 40 ? "text-amber-400" : "text-white")}>
                  {entry.waterPct}%
                </div>
                <div className="col-span-1 text-center font-medium text-white">
                  {entry.ldrPct}%
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              <div className="p-4 text-center text-white/40 italic">Menunggu data...</div>
            )}
          </div>
        </div>

      </div>
    </GlassPanel>
  );
}

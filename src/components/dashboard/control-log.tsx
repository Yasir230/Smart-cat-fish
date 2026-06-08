'use client';

import { ListOrdered, Play, Square, Settings } from 'lucide-react';
import { HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { cn, formatTimestamp } from '@/lib/utils';

interface ControlLogProps {
  history: HistoryEntry[];
  isLoading: boolean;
}

export function ControlLog({ history, isLoading }: ControlLogProps) {
  if (isLoading) {
    return (
      <GlassPanel title="Log Kontrol" icon={ListOrdered}>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="w-full h-12 rounded-lg" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  // Generate aerator toggle events from history
  // Detect state changes in aeratorOn
  const events = [];
  let currentState = history.length > 0 ? history[0].aeratorOn : false;
  
  // Start from oldest to newest to detect changes
  const chronological = [...history].reverse();
  
  for (let i = 1; i < chronological.length; i++) {
    const prev = chronological[i - 1];
    const curr = chronological[i];
    
    if (prev.aeratorOn !== curr.aeratorOn) {
      events.push({
        id: `event-${i}`,
        type: curr.aeratorOn ? 'TURN_ON' : 'TURN_OFF',
        timestamp: curr.timestamp,
        trigger: curr.doRisk >= 5 ? 'AUTO_CRITICAL' : curr.doRisk <= 2 ? 'AUTO_SAFE' : 'MANUAL_OVERRIDE',
        riskContext: curr.doPredicted
      });
    }
  }

  // Reverse back to newest first for UI
  const displayEvents = events.reverse().slice(0, 10);

  return (
    <GlassPanel title="Log Kontrol Aerator" icon={ListOrdered} className="md:col-span-1">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[350px]">
          {displayEvents.length > 0 ? (
            displayEvents.map((event) => {
              const isOn = event.type === 'TURN_ON';
              const isAuto = event.trigger.startsWith('AUTO');
              
              return (
                <div 
                  key={event.id}
                  className={cn(
                    "bg-white/5 border rounded-xl p-3 flex gap-3 hover:bg-white/10 transition-colors",
                    isOn ? "border-sky-500/20" : "border-white/10"
                  )}
                >
                  <div className="mt-0.5">
                    {isOn ? (
                      <div className="p-1.5 rounded-md bg-sky-500/20 text-sky-400">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-md bg-white/10 text-white/60">
                        <Square className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-semibold", isOn ? "text-sky-400" : "text-white/80")}>
                        {isOn ? 'Aerator MENYALA' : 'Aerator MATI'}
                      </p>
                      <span className="text-[10px] text-white/40 font-mono">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-white/50 border border-white/10 rounded px-1.5 py-0.5">
                        {isAuto ? <Settings className="w-3 h-3" /> : <ListOrdered className="w-3 h-3" />}
                        <span>{isAuto ? 'Sistem Otomatis (AI)' : 'Manual Override'}</span>
                      </div>
                      <span className="text-[10px] text-white/40">DO: {event.riskContext.toFixed(1)} mg/L</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-white/40">
              <ListOrdered className="w-6 h-6 opacity-50 mb-2" />
              <p className="text-sm">Belum ada aktivitas aerator tercatat.</p>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

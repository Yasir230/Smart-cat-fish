'use client';

import { AlertTriangle, Bell, Volume2, VolumeX, Info } from 'lucide-react';
import { AlertData, HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn, formatTimestamp, riskScoreToLevel } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertFeedProps {
  alert: AlertData | null;
  history: HistoryEntry[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  isLoading: boolean;
}

// Extract fake alert history from data history for UI demo purposes if real alert history isn't passed down
// (In a full app we'd pass alertHistory from useAlerts)
function generateAlertsFromHistory(history: HistoryEntry[]): AlertData[] {
  return history
    .filter(h => h.doRisk >= 3)
    .map((h, i) => ({
      active: false,
      riskScore: h.doRisk,
      message: h.doRisk >= 5 
        ? `DO drop kritis ke ${h.doPredicted.toFixed(1)} mg/L!` 
        : `Kondisi waspada, DO terpantau ${h.doPredicted.toFixed(1)} mg/L.`,
      timestamp: h.timestamp
    }))
    .reverse()
    .slice(0, 10);
}

export function AlertFeed({ alert, history, soundEnabled, onToggleSound, isLoading }: AlertFeedProps) {
  if (isLoading) {
    return (
      <GlassPanel title="Sistem Peringatan" icon={Bell}>
        <div className="flex flex-col h-full gap-3">
          <SkeletonLoader className="w-full h-10 rounded-lg" />
          <SkeletonLoader className="w-full h-16 rounded-xl" />
          <SkeletonLoader className="w-full h-16 rounded-xl" />
        </div>
      </GlassPanel>
    );
  }

  const alertList = generateAlertsFromHistory(history);
  
  // Combine real active alert with history
  const displayAlerts = alert && alert.active 
    ? [alert, ...alertList.filter(a => a.timestamp !== alert.timestamp)] 
    : alertList;

  return (
    <GlassPanel 
      title="Sistem Peringatan" 
      icon={Bell} 
      className="md:col-span-1"
      headerAction={
        <button 
          onClick={onToggleSound}
          className={cn(
            "p-2 rounded-lg transition-colors border",
            soundEnabled 
              ? "bg-sky-500/20 text-sky-400 border-sky-500/30" 
              : "bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10"
          )}
          title={soundEnabled ? "Matikan suara peringatan" : "Nyalakan suara peringatan"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      }
    >
      <div className="flex flex-col h-full space-y-4">
        
        {/* Rules Legend */}
        <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 px-3 border border-white/5 text-[10px] font-medium tracking-wider">
          <div className="flex items-center gap-1.5 text-sky-400"><div className="w-2 h-2 rounded-full bg-sky-400" /> &gt; 4 AMAN</div>
          <div className="flex items-center gap-1.5 text-amber-400"><div className="w-2 h-2 rounded-full bg-amber-400" /> 2-4 WASPADA</div>
          <div className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-400" /> &lt; 2 KRITIS</div>
        </div>

        {/* Active Alert Banner */}
        <AnimatePresence>
          {alert && alert.active && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-red-400 font-bold text-sm tracking-wide">PERINGATAN KRITIS</h4>
                  <p className="text-white text-sm mt-1">{alert.message}</p>
                  <p className="text-red-400/70 text-xs mt-2 font-mono">{formatTimestamp(alert.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 relative min-h-[150px]">
          {displayAlerts.length > 0 ? (
            displayAlerts.map((item, idx) => {
              const level = riskScoreToLevel(item.riskScore);
              // Skip the active one since it's in the banner
              if (item.active && alert && item.timestamp === alert.timestamp) return null;
              
              return (
                <div 
                  key={`${item.timestamp}-${idx}`}
                  className="bg-white/5 border border-white/5 rounded-xl p-3 flex gap-3 hover:bg-white/10 transition-colors"
                >
                  <div className="mt-0.5">
                    {level === 'danger' || level === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : level === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/90 leading-tight">{item.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-white/40 font-mono">{formatTimestamp(item.timestamp)}</span>
                      <StatusBadge status={level} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm font-medium">Tidak ada peringatan</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">Semua parameter kolam berada dalam batas aman.</p>
            </div>
          )}
        </div>

      </div>
    </GlassPanel>
  );
}

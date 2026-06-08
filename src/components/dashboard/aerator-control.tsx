'use client';

import { useState } from 'react';
import { Fan, Power, Settings2, Timer, Zap } from 'lucide-react';
import { SensorReading, HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AeratorControlProps {
  reading: SensorReading | null;
  history: HistoryEntry[];
  onCommand: (cmd: 'on' | 'off' | 'auto') => void;
  isRateLimited: boolean;
  isLoading: boolean;
}

export function AeratorControl({ reading, history, onCommand, isRateLimited, isLoading }: AeratorControlProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'on' | 'off' | null>(null);

  if (isLoading) {
    return (
      <GlassPanel title="Aerator Control" icon={Fan}>
        <div className="flex flex-col h-full gap-4">
          <SkeletonLoader className="w-full h-16 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonLoader className="w-full h-24 rounded-xl" />
            <SkeletonLoader className="w-full h-24 rounded-xl" />
          </div>
        </div>
      </GlassPanel>
    );
  }
  
  if (!reading) {
    return (
      <GlassPanel title="Aerator Control" icon={Fan} className="md:col-span-1">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/40 text-sm">
          <Fan className="w-8 h-8 opacity-20 mb-3" />
          <p>Koneksi perangkat terputus...</p>
        </div>
      </GlassPanel>
    );
  }

  // Calculate efficiency (simulated based on risk trend)
  const efficiency = reading.doRisk <= 4 ? "Tinggi (92%)" : reading.doRisk <= 6 ? "Sedang (65%)" : "Rendah (30%)";
  
  const handleManualAction = (action: 'on' | 'off') => {
    if (isRateLimited) return;
    setPendingAction(action);
    setShowConfirm(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      onCommand(pendingAction);
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  return (
    <GlassPanel title="Aerator Control" icon={Fan} className="md:col-span-1">
      <div className="flex flex-col h-full space-y-5">
        
        {/* Main Status & Animation */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
              reading.aeratorOn 
                ? "bg-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]" 
                : "bg-white/5 text-white/30"
            )}>
              <motion.div
                animate={{ rotate: reading.aeratorOn ? 360 : 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Fan className="w-6 h-6" />
              </motion.div>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-medium">STATUS</p>
              <p className={cn("text-lg font-bold", reading.aeratorOn ? "text-sky-400" : "text-white/60")}>
                {reading.aeratorOn ? "MENYALA" : "MATI"}
              </p>
            </div>
          </div>
          
          {/* Auto/Manual Toggle Simulation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Auto</span>
            <button 
              onClick={() => onCommand('auto')}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-300",
                "bg-sky-500" // Always auto in this Arduino version unless manually overridden temporarily
              )}
            >
              <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="grid grid-cols-2 gap-3 relative">
          <button
            onClick={() => handleManualAction('on')}
            disabled={isRateLimited || reading.aeratorOn}
            className={cn(
              "flex flex-col items-center justify-center py-4 rounded-xl border transition-all",
              reading.aeratorOn ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed" : 
              isRateLimited ? "bg-white/5 border-white/10 opacity-50 cursor-wait" :
              "bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 text-sky-400 hover:shadow-[0_0_10px_rgba(14,165,233,0.3)]"
            )}
          >
            <Power className="w-5 h-5 mb-1" />
            <span className="text-xs font-semibold">TURN ON</span>
          </button>
          
          <button
            onClick={() => handleManualAction('off')}
            disabled={isRateLimited || !reading.aeratorOn}
            className={cn(
              "flex flex-col items-center justify-center py-4 rounded-xl border transition-all",
              !reading.aeratorOn ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed" : 
              isRateLimited ? "bg-white/5 border-white/10 opacity-50 cursor-wait" :
              "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            )}
          >
            <Power className="w-5 h-5 mb-1" />
            <span className="text-xs font-semibold">TURN OFF</span>
          </button>
          
          {/* Rate Limit Overlay */}
          <AnimatePresence>
            {isRateLimited && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center border border-amber-500/50"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <Timer className="w-4 h-4 animate-spin-slow" />
                  <span className="text-xs font-medium">Rate Limit Aktif (5s)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 flex-1 mt-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Efisiensi</span>
            </div>
            <span className={cn("font-semibold text-sm", reading.doRisk <= 4 ? "text-emerald-400" : "text-amber-400")}>
              {efficiency}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Settings2 className="w-3 h-3" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Trigger</span>
            </div>
            <span className="font-semibold text-sm text-white">DO &lt; 3.0</span>
          </div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-10 bg-[var(--color-ocean-dark)]/95 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-6 border border-white/20"
            >
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <h4 className="text-white font-semibold text-center mb-1">Konfirmasi Override</h4>
              <p className="text-white/60 text-xs text-center mb-6">
                Mengubah status aerator secara manual akan mengabaikan logika AI sementara.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmAction}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors shadow-lg",
                    pendingAction === 'on' ? "bg-sky-500 hover:bg-sky-400 shadow-sky-500/20" : "bg-red-500 hover:bg-red-400 shadow-red-500/20"
                  )}
                >
                  Ya, {pendingAction === 'on' ? 'Nyalakan' : 'Matikan'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </GlassPanel>
  );
}
// Add AlertTriangle to imports
import { AlertTriangle } from 'lucide-react';

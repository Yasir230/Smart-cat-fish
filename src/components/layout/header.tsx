'use client';

import { useState, useEffect } from 'react';
import { Bell, Menu, Wifi, WifiOff } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface HeaderProps {
  title?: string;
  isConnected: boolean;
  alertCount?: number;
}

export function Header({ title = "Dashboard", isConnected, alertCount = 0 }: HeaderProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-6 border-b border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-semibold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Real-time Clock */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-white tracking-wider">
            {time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
          </p>
          <p className="text-[10px] text-white/50 uppercase tracking-widest">
            {time ? time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : '---'}
          </p>
        </div>

        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2">
          {isConnected ? (
            <StatusBadge status="online" label="Online" pulse />
          ) : (
            <StatusBadge status="offline" label="Offline" />
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all focus:outline-none">
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1/4 -translate-y-1/4 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

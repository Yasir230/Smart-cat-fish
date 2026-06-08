'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, AlertTriangle, Settings, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: Activity },
  { name: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] backdrop-blur-2xl transition-all duration-300 z-40 h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-[var(--color-glass-border)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)]">
          <Droplets className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-wide leading-tight">Smart Catfish</h1>
          <p className="text-sky-300 text-[10px] uppercase font-semibold tracking-wider">Edge AI Monitor</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors", 
                isActive ? "text-sky-400" : "group-hover:text-sky-300"
              )} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[var(--color-glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-xs font-bold text-white">YR</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Yaris Akbar R.</p>
            <p className="text-xs text-white/50">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

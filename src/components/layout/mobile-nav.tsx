'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, AlertTriangle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] backdrop-blur-2xl z-40 px-6 pb-safe">
      <div className="flex items-center justify-between h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300",
                isActive ? "text-sky-400" : "text-white/50 hover:text-white/80"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]")} />
                {isActive && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_5px_rgba(14,165,233,1)]" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

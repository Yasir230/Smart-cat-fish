'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';

interface GlassPanelProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  delay?: number;
}

export function GlassPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  headerAction,
  delay = 0
}: GlassPanelProps) {
  return (
    <GlassCard className={cn('flex flex-col', className)} delay={delay} padding="none">
      <div className="flex items-center justify-between p-5 border-b border-[var(--color-glass-border)]">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-white/5 text-sky-400">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {children}
      </div>
    </GlassCard>
  );
}

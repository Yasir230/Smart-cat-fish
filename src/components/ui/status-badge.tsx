'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'safe' | 'warning' | 'critical' | 'danger' | 'online' | 'offline';
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  pulse = false,
  size = 'md',
  className
}: StatusBadgeProps) {
  
  const statusConfig = {
    safe: { color: 'bg-sky-400', text: 'text-sky-400', border: 'border-sky-400/30', bgLight: 'bg-sky-400/10' },
    warning: { color: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400/30', bgLight: 'bg-amber-400/10' },
    critical: { color: 'bg-red-400', text: 'text-red-400', border: 'border-red-400/30', bgLight: 'bg-red-400/10' },
    danger: { color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/30', bgLight: 'bg-red-500/10' },
    online: { color: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400/30', bgLight: 'bg-emerald-400/10' },
    offline: { color: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400/30', bgLight: 'bg-gray-400/10' },
  };

  const config = statusConfig[status];
  
  const sizeConfig = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  };

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border backdrop-blur-md font-medium uppercase tracking-wider',
      config.border,
      config.bgLight,
      config.text,
      sizeConfig[size],
      className
    )}>
      <div className="relative flex items-center justify-center">
        {pulse && (
          <motion.div
            className={cn('absolute rounded-full opacity-75', config.color, dotSize)}
            animate={{ scale: [1, 2.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <div className={cn('rounded-full', config.color, dotSize)} />
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}

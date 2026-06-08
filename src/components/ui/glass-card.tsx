'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  delay?: number;
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow, 
  padding = 'md',
  delay = 0 
}: GlassCardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn(
        'glass-card relative overflow-hidden group',
        hover && 'glass-hover cursor-pointer transform hover:scale-[1.02]',
        paddingClasses[padding],
        className
      )}
      style={glow ? { boxShadow: `0 0 20px ${glow}20` } : {}}
    >
      {/* Optional Glow Effect Background */}
      {glow && (
        <div 
          className="absolute -inset-10 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl"
          style={{ backgroundColor: glow }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
}

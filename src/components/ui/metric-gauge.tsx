'use client';

import { motion } from 'framer-motion';
import { cn, riskScoreToColor } from '@/lib/utils';
import { RiskLevel } from '@/types';

interface MetricGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  riskScore: number;
  pulse?: boolean;
}

export function MetricGauge({
  value,
  max,
  label,
  unit = '',
  size = 'md',
  riskScore,
  pulse = false
}: MetricGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Circumference calculation
  const radius = size === 'sm' ? 40 : size === 'md' ? 60 : 80;
  const strokeWidth = size === 'sm' ? 8 : size === 'md' ? 12 : 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Size classes
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56'
  };

  // Determine color based on risk score (Arduino reverse logic: higher DO = lower risk score = safe)
  let colorClass = 'text-sky-400'; // Safe
  let glowColor = 'rgba(14, 165, 233, 0.4)';
  
  if (riskScore >= 7) {
    colorClass = 'text-red-500'; // Danger
    glowColor = 'rgba(239, 68, 68, 0.6)';
  } else if (riskScore >= 5) {
    colorClass = 'text-red-400'; // Critical
    glowColor = 'rgba(248, 113, 113, 0.4)';
  } else if (riskScore >= 3) {
    colorClass = 'text-amber-400'; // Warning
    glowColor = 'rgba(251, 191, 36, 0.4)';
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        {/* Glow effect for critical levels */}
        {(pulse || riskScore >= 5) && (
          <motion.div 
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: glowColor }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90 absolute inset-0">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/10"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn('drop-shadow-lg transition-colors duration-500', colorClass)}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn(
              "font-bold text-white",
              size === 'sm' ? "text-xl" : size === 'md' ? "text-4xl" : "text-6xl"
            )}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            key={value} // Re-animate slightly when value changes
          >
            {value.toFixed(1)}
          </motion.span>
          {unit && (
            <span className={cn(
              "text-white/60 font-medium",
              size === 'sm' ? "text-[10px]" : size === 'md' ? "text-sm" : "text-lg"
            )}>
              {unit}
            </span>
          )}
        </div>
      </div>
      
      {/* Label */}
      <div className="mt-4 text-center">
        <span className="text-white/80 font-medium tracking-wide uppercase text-sm">
          {label}
        </span>
      </div>
    </div>
  );
}

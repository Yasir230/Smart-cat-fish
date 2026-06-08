'use client';

import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-white/5 rounded-xl border border-white/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
    />
  );
}

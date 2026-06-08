'use client';

import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate random bubbles
  const bubbles = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 60 + 20; // 20px to 80px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = Math.random() * 10; // 0s to 10s
    const opacity = Math.random() * 0.15 + 0.05; // 0.05 to 0.2
    
    return { id: i, size, left, duration, delay, opacity };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[var(--color-ocean-dark)]">
      {/* Deep Ocean Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-[#134e4a] to-[#1e1b4b] opacity-80" />
      
      {/* Light Rays */}
      <div className="absolute top-0 left-[20%] w-[40%] h-[150%] bg-gradient-to-b from-sky-400/10 to-transparent transform -rotate-45 origin-top-left blur-3xl mix-blend-overlay" />
      <div className="absolute top-0 right-[10%] w-[30%] h-[150%] bg-gradient-to-b from-teal-400/10 to-transparent transform -rotate-[30deg] origin-top-right blur-3xl mix-blend-overlay" />

      {/* Floating Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute bottom-[-100px] rounded-full border border-white/20 bg-white/5"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            opacity: bubble.opacity,
            animation: `bubble-rise ${bubble.duration}s ease-in infinite ${bubble.delay}s`
          }}
        />
      ))}

      {/* CSS for bubble animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bubble-rise {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: ${bubbles[0].opacity};
          }
          50% {
            transform: translateY(-50vh) scale(1.2) rotate(180deg);
          }
          90% {
            opacity: ${bubbles[0].opacity};
          }
          100% {
            transform: translateY(-120vh) scale(1.5) rotate(360deg);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}

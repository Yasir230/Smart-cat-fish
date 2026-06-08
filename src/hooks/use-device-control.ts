'use client';

import { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FIREBASE_PATHS, AERATOR_RATE_LIMIT } from '@/lib/constants';

export function useDeviceControl() {
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [lastCommandTime, setLastCommandTime] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  const sendCommand = async (command: 'on' | 'off' | 'auto') => {
    const now = Date.now();
    
    // Check rate limit
    if (now - lastCommandTime < AERATOR_RATE_LIMIT) {
      setIsRateLimited(true);
      setError(new Error(`Tunggu ${Math.ceil((AERATOR_RATE_LIMIT - (now - lastCommandTime)) / 1000)} detik sebelum menekan lagi.`));
      
      // Auto clear rate limit state after it expires
      setTimeout(() => {
        setIsRateLimited(false);
        setError(null);
      }, AERATOR_RATE_LIMIT - (now - lastCommandTime));
      
      return;
    }

    try {
      // In a real system we would send this to a /commands/ node that ESP32 listens to.
      // But since the ESP32 code provided ONLY reads sensors and writes to /catfish/latest,
      // and doesn't listen to a command path, we'll simulate the dashboard state update.
      // IF ESP32 was updated to listen, we'd write to e.g., /catfish/control/aerator
      
      const controlRef = ref(db, '/catfish/control/aerator');
      await set(controlRef, {
        command,
        timestamp: new Date().toISOString(),
        manualOverride: command !== 'auto'
      });
      
      setLastCommandTime(now);
      setIsRateLimited(true);
      setError(null);
      
      // Clear rate limit UI after AERATOR_RATE_LIMIT ms
      setTimeout(() => setIsRateLimited(false), AERATOR_RATE_LIMIT);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Gagal mengirim perintah'));
    }
  };

  return { sendCommand, isRateLimited, lastCommandTime, error };
}

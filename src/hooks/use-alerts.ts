'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { AlertData } from '@/types';
import { FIREBASE_PATHS } from '@/lib/constants';

export function useAlerts() {
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for alerts
    if (typeof window !== 'undefined') {
      // Using a standard beep sound data URI
      const beepUri = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU';
      const audio = new Audio(beepUri);
      audioRef.current = audio;
    }
  }, []);

  const playAlertSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    // Escape loading state if connection hangs or env vars are missing
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const alertRef = ref(db, FIREBASE_PATHS.ALERT);
    
    const unsubscribe = onValue(alertRef, (snapshot) => {
      clearTimeout(timeoutId);
      try {
        if (snapshot.exists()) {
          const val = snapshot.val();
          
          const alert: AlertData = {
            active: val.active || false,
            riskScore: val.riskScore || 0,
            message: val.message || '',
            timestamp: val.timestamp || new Date().toISOString()
          };
          
          // If we got a new active alert
          if (alert.active && (!currentAlert || currentAlert.timestamp !== alert.timestamp)) {
            setCurrentAlert(alert);
            
            // Add to history
            setAlertHistory(prev => {
              const newHistory = [alert, ...prev];
              if (newHistory.length > 50) return newHistory.slice(0, 50);
              return newHistory;
            });
            
            // Play sound for new critical alerts
            if (alert.riskScore >= 5) {
              playAlertSound();
            }
          } else if (!alert.active) {
            setCurrentAlert(null);
          }
        }
      } catch (err) {
        console.error("Error parsing alert data:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentAlert, soundEnabled]); // Re-bind when these change so the closure has latest values

  return { currentAlert, alertHistory, isLoading, soundEnabled, toggleSound };
}

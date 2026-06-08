'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SensorReading, HistoryEntry } from '@/types';
import { FIREBASE_PATHS } from '@/lib/constants';
import { doFromRiskScore } from '@/lib/utils';

export function useRealtimeData() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const dataRef = ref(db, FIREBASE_PATHS.LATEST);
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const val = snapshot.val();
          
          // Construct SensorReading
          const newReading: SensorReading = {
            suhu: val.suhu || 0,
            waterPct: val.waterPct || 0,
            ldrPct: val.ldrPct || 0,
            doRisk: val.doRisk || 0,
            doPredicted: val.doPredicted !== undefined ? val.doPredicted : doFromRiskScore(val.doRisk || 0),
            aeratorOn: val.aeratorOn || false,
            buzzerMode: val.buzzerMode || 0,
            mode: val.mode || 'RuleBased',
            timestamp: val.timestamp || new Date().toISOString()
          };
          
          setData(newReading);
          
          // Add to history (keep last 100)
          setHistory(prev => {
            // Avoid duplicate timestamps if possible
            if (prev.length > 0 && prev[prev.length - 1].timestamp === newReading.timestamp) {
              return prev;
            }
            
            const newHistoryEntry: HistoryEntry = {
              doRisk: newReading.doRisk,
              doPredicted: newReading.doPredicted,
              suhu: newReading.suhu,
              waterPct: newReading.waterPct,
              ldrPct: newReading.ldrPct,
              timestamp: newReading.timestamp,
              aeratorOn: newReading.aeratorOn
            };
            
            const newHistory = [...prev, newHistoryEntry];
            if (newHistory.length > 100) return newHistory.slice(newHistory.length - 100);
            return newHistory;
          });
          
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error parsing Firebase data'));
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, history, isLoading, error };
}

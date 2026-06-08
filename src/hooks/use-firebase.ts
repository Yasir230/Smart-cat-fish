'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export function useFirebase() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Firebase special path for connection status
    const connectedRef = ref(db, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
      }
    }, (err) => {
      setError(err);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, []);

  return { db, isConnected, error };
}

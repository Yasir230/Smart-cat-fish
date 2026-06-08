import { useState, useCallback } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase';

export function useFCM() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
        console.error('Firebase App ID is missing. Cannot initialize FCM.');
        return;
      }
      
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        setFcmToken(token);
        return token;
      } else {
        console.warn('Notification permission denied.');
      }
    } catch (err: any) {
      console.error('An error occurred while retrieving token. ', err);
      setError(err);
    }
  }, []);

  return { fcmToken, requestPermission, error };
}

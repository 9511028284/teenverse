import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app } from '../firebase';
import { supabase } from '../supabase';

const SERVICE_WORKER_PATH = new URL('../firebase-messaging-sw.js', import.meta.url);
const DEFAULT_ICON = '/teenverse.svg';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const SERVICE_WORKER_READY_TIMEOUT_MS = 4000;

const getMessagingInstance = async () => {
  if (!(await isSupported())) return null;
  return getMessaging(app);
};

export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

const waitForActiveServiceWorker = async (registration) => {
  if (!registration) return null;
  if (registration.active) return registration;

  try {
    const readyRegistration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Notification service worker activation timed out')), SERVICE_WORKER_READY_TIMEOUT_MS);
      }),
    ]);

    return readyRegistration?.active ? readyRegistration : registration.active ? registration : null;
  } catch (error) {
    console.warn('Notification service worker is not active yet:', error);
    return registration.active ? registration : null;
  }
};

export const registerNotificationServiceWorker = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      type: 'module',
    });
    return waitForActiveServiceWorker(registration);
  } catch (error) {
    console.warn('Notification service worker registration failed:', error);
    return null;
  }
};

export const requestNotificationPermission = async (userId) => {
  if (getNotificationPermission() === 'unsupported') return 'unsupported';
  if (!VAPID_KEY) return 'missing-vapid-key';

  const registration = await registerNotificationServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  const messaging = await getMessagingInstance();
  if (!messaging || !registration) return 'unsupported';

  const fcmToken = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!fcmToken) return 'token-unavailable';

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        fcm_token: fcmToken,
        user_agent: navigator.userAgent,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: 'fcm_token' }
    );

  if (error) {
    console.warn('FCM token save failed:', error);
    return 'token-save-failed';
  }

  return permission;
};

export const removePushToken = async (userId) => {
  const messaging = await getMessagingInstance();
  if (!messaging || !VAPID_KEY) return;

  const registration = await registerNotificationServiceWorker();
  const fcmToken = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  }).catch(() => null);

  if (fcmToken) {
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken);
  }

  await deleteToken(messaging).catch(() => {});
};

export const listenForForegroundMessages = async (callback) => {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback?.(payload);
  });
};

export const showBrowserNotification = async ({
  title = 'TeenVerse',
  body,
  tag,
  url = '/',
} = {}) => {
  if (!body || getNotificationPermission() !== 'granted') return false;

  const options = {
    body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag,
    data: { url },
  };

  try {
    const registration = await registerNotificationServiceWorker();
    if (registration?.active && registration.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch (error) {
    console.warn('Service worker notification failed, using browser notification fallback:', error);
  }

  new Notification(title, options);
  return true;
};

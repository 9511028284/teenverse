import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_firebase_apikeys,
  authDomain: import.meta.env.VITE_firebase_authdomain,
  projectId: 'teenverse-app',
  storageBucket: import.meta.env.VITE_firebase_bucket,
  messagingSenderId: import.meta.env.VITE_firebase_messageid,
  appId: import.meta.env.VITE_firebase_appId,
};

const DEFAULT_URL = '/dashboard';
const DEFAULT_ICON = '/teenverse.svg';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title || payload.data?.title || 'TeenVerse alert';
  const body = payload.notification?.body || payload.data?.body || 'You have a new TeenVerse update.';
  const url = payload.data?.url || DEFAULT_URL;

  self.registration.showNotification(title, {
    body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag: payload.data?.tag || `teenverse-${Date.now()}`,
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || DEFAULT_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch (_error) {
          return false;
        }
      });

      if (existingClient) {
        existingClient.navigate(targetUrl);
        return existingClient.focus();
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

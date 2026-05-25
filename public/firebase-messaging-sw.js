/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDmUKR4IQnKjacWiGBulmEpbePmLUsihaM',
  authDomain: 'teenverse-app.firebaseapp.com',
  projectId: 'teenverse-app',
  storageBucket: 'teenverse-app.firebasestorage.app',
  messagingSenderId: '194598066430',
  appId: '1:194598066430:web:75febac18920121995edaf',
});

const messaging = firebase.messaging();
const DEFAULT_URL = '/dashboard';
const DEFAULT_ICON = '/teenverse.svg';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
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

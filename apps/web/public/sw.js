// ApplyFields W3C Standard Web Push Service Worker
// Handles background push events, system notification display, and deep-link click routing.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'ApplyFields Alert', body: event.data.text() };
    }
  }

  const title = data.title || 'ApplyFields Notification';
  const options = {
    body: data.body || 'You have a new update regarding your saved opportunities.',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'applyfields-alert',
    renotify: true,
    data: {
      url: data.link || '/notifications',
      timestamp: data.timestamp || Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View Details' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/notifications';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab of ApplyFields is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(absoluteUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    }),
  );
});

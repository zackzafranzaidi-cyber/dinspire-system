self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through everything without caching to prevent stale UI
});

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icon.png',
        badge: data.icon || '/icon.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' }
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch(e) {
      console.error("Push data parse error:", e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

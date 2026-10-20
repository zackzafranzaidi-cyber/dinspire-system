/**
 * Dinspire God Mode Service Worker
 * Kalis iOS Safari / WebKit & Android Chrome
 */

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "God Mode Alert", body: event.data ? event.data.text() : "Notifikasi dari Sistem Dinspire" };
  }

  const title = data.title || "God Mode - Dinspire";
  const options = {
    body: data.body || "Pusat kawalan pelayan beroperasi.",
    icon: data.icon || "/owner/icon_owner.png",
    badge: "/owner/icon_owner.png",
    data: { url: data.url || "/dev-sys-9x8q2/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "/dev-sys-9x8q2/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes("/dev-sys-9x8q2") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

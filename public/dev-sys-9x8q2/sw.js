self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "Mesej baru dari Sistem",
    icon: data.icon || "/owner/icon_owner.png",
    badge: "/owner/icon_owner.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/api/dev-sys-9x8q2/portal" }
  };
  event.waitUntil(self.registration.showNotification(data.title || "God Mode", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { client = clientList[i]; }
        }
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

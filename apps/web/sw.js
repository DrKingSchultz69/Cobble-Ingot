// Netheron service worker: shows push notifications (P24 S2). Pushes carry no data, so on each push
// we fetch the latest notification from the server (same origin, with the login cookie).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let n = { title: "Netheron", body: "A task needs you.", task: "" };
    try {
      const r = await fetch("/api/push/last", { credentials: "include" });
      if (r.ok) n = (await r.json()) || n;
    } catch { /* offline: show the generic text */ }
    // Skip if a Netheron tab is open and focused: the page shows its own pop-up.
    const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (tabs.some((c) => c.focused)) return;
    await self.registration.showNotification(n.title, { body: n.body, icon: "/icon.svg", tag: n.task || "netheron", data: { task: n.task } });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const task = event.notification.data?.task;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const url = task ? `/#task=${task}` : "/";
    if (tabs[0]) { await tabs[0].focus(); tabs[0].postMessage({ openTask: task }); return; }
    await self.clients.openWindow(url);
  })());
});

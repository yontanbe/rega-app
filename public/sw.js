// Offline support for Rega. Paths are relative to this file, so it works under any base path.
const CACHE = "rega-v1";
const SHELL = ["./", "./breathe/", "./meditate/", "./sleep/", "./progress/", "./help/", "./manifest.webmanifest", "./icons/icon-192.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Cache each page on its own so one failure doesn't block the install.
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates show up, cache as fallback when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./"))),
    );
    return;
  }

  // Hashed build assets, fonts and icons: cache first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

// Offline support for Rega. Paths are relative to this file, so it works under any base path.
const CACHE = "rega-v2";
const MEDIA_CACHE = "rega-media-v1"; // filled on demand by the "save offline" button and by plays
const SHELL = [
  "./",
  "./meditate/",
  "./meditate/timer/",
  "./meditate/calm/",
  "./meditate/body/",
  "./meditate/sleep/",
  "./meditate/focus/",
  "./breathe/",
  "./sleep/",
  "./progress/",
  "./help/",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./img/hero-day.webp",
  "./img/hero-night.webp",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Cache each page on its own so one failure doesn't block the install.
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Media elements ask for byte ranges (Safari always does); answer them from a cached full file. */
async function rangeFromCache(req, cached) {
  const range = req.headers.get("range");
  if (!range) return cached;
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = buf.byteLength;
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = m && m[2] ? Number(m[2]) : size - 1;
  if (m && !m[1] && m[2]) {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  }
  if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Audio: serve saved files (offline), otherwise go to the network untouched so streaming and ranges work.
  if (url.pathname.includes("/audio/")) {
    event.respondWith(
      caches
        .open(MEDIA_CACHE)
        .then((c) => c.match(url.pathname, { ignoreSearch: true }).then((hit) => hit || c.match(req.url, { ignoreSearch: true })))
        .then((hit) => (hit ? rangeFromCache(req, hit) : fetch(req))),
    );
    return;
  }

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

  // Hashed build assets, fonts, images and icons: cache first.
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

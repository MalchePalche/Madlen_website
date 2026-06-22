// Madlen PWA service worker.
// Strategy:
//   • Admin page navigations  → network-first, fall back to cache (offline view)
//   • Build/static assets      → cache-first (fast repeat loads)
// Bump CACHE when the strategy changes to evict old entries.

const CACHE = "madlen-pwa-v1";

// Best-effort precache of the admin shell so the app opens offline. Each URL is
// fetched with the user's cookies; if one fails (e.g. not signed in) we ignore
// it rather than failing the whole install.
const PRECACHE = ["/admin", "/admin/prodakti", "/admin/poruchki"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { credentials: "same-origin" })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null),
        ),
      ),
    ),
  );
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
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first so admins always see fresh data when
  // online, with the last-seen page served when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match("/admin")) || Response.error();
        }),
    );
    return;
  }

  // Hashed build assets and icons: cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
});

/* Calculadora Comercial - Service Worker (safe cache) */
const VERSION = "2026-03-02-1";
const CACHE_NAME = `calc-comercial-${VERSION}`;
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/styles.css",
  "/src/main.js",
  "/src/core/engine.js",
  "/src/core/history.js",
  "/src/core/theme.js",
  "/src/core/memory.js",
  "/src/core/pwa.js",
  "/src/core/commercial/commercial.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// App Shell: para navegações, devolve index.html do cache (offline-friendly)
async function handleNavigate() {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match("/index.html");
  return cached || fetch("/index.html");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só cuidar do mesmo origin
  if (url.origin !== self.location.origin) return;

  // Navegação (SPA)
  if (req.mode === "navigate") {
    event.respondWith(handleNavigate());
    return;
  }

  // Evitar cachear o próprio SW (sempre rede)
  if (url.pathname === "/service-worker.js") {
    event.respondWith(fetch(req));
    return;
  }

  // Stale-While-Revalidate para assets GET
  if (req.method === "GET") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);

      return cached || (await fetchPromise) || new Response("", { status: 504, statusText: "Offline" });
    })());
  }
});

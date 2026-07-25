// ── BTC Cycle Tracker — service worker ─────────────────────────────────
// Strategy:
//   • App shell (this page, manifest, icons, Chart.js): stale-while-revalidate.
//     Repeat visits paint instantly from cache; a background fetch refreshes
//     the cache so the NEXT visit gets the newest deploy.
//   • Live APIs (CoinGecko, mempool.space, alternative.me): network-only.
//     We never serve stale market data as if it were live.
//   • Full offline: the app opens and every calculator works offline; the
//     in-page code already degrades gracefully when live feeds are absent.
const CACHE = 'btc-cycle-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

const LIVE_API_HOSTS = [
  'api.coingecko.com',
  'mempool.space',
  'api.alternative.me',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // allSettled, not addAll: one flaky fetch must never sink the whole install
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Live market data: straight to the network, never cached.
  if (LIVE_API_HOSTS.includes(url.hostname)) return;

  // App shell + assets: stale-while-revalidate.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const refresh = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return resp;
        })
        .catch(() => cached); // offline: fall back to cache
      return cached || refresh;
    })
  );
});

// sw.js - Service Worker for KeepSafe PWA
const CACHE_VERSION = 'keepsafe-v1';
const CACHE_NAME = `${CACHE_VERSION}`;
const APP_SHELL = [
  '/',                // important for navigation fallback
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/favicon.ico'
];

// Utility: try to add a single URL to cache safely
async function cacheAddSafe(cache, url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res && res.ok) {
      await cache.put(url, res.clone());
      return true;
    } else {
      console.warn('[SW] cacheAddSafe failed response for', url, res && res.status);
      return false;
    }
  } catch (err) {
    console.warn('[SW] cacheAddSafe fetch error for', url, err);
    return false;
  }
}

// Install - pre-cache app shell (best-effort)
self.addEventListener('install', (evt) => {
  self.skipWaiting(); // activate new SW immediately (you may remove if you want wait)
  evt.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Add resources one-by-one so one missing file doesn't break the whole install
    for (const url of APP_SHELL) {
      await cacheAddSafe(cache, url);
    }
    console.log('[SW] Installed and cached app shell');
  })());
});

// Activate - cleanup old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }
      return null;
    }));
    // take control immediately
    await self.clients.claim();
    console.log('[SW] Activated');
  })());
});

// Fetch handler
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Network-first for navigations (HTML) so users get updates quickly
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    evt.respondWith((async () => {
      try {
        const networkResp = await fetch(req);
        // Put a copy in cache for offline
        const cache = await caches.open(CACHE_NAME);
        if (networkResp && networkResp.ok) {
          cache.put('/index.html', networkResp.clone()); // update cached index
        }
        return networkResp;
      } catch (err) {
        // If network fails, return cached index.html fallback
        console.warn('[SW] Network failed for navigation, serving cached index.html', err);
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/index.html');
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // For other requests -> cache-first (static assets)
  evt.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) {
      // start background update for freshness
      evt.waitUntil((async () => {
        try {
          const networkResp = await fetch(req);
          if (networkResp && networkResp.ok) {
            await cache.put(req, networkResp.clone());
          }
        } catch (e) {
          // ignore network update errors
        }
      })());
      return cached;
    }
    // not cached -> try network and optionally cache it
    try {
      const netResp = await fetch(req);
      if (netResp && netResp.ok) {
        // cache it for next time
        cache.put(req, netResp.clone());
      }
      return netResp;
    } catch (err) {
      // fetch failed and nothing in cache
      console.warn('[SW] Resource fetch failed and not cached:', req.url, err);
      return new Response('Network error', { status: 503, statusText: 'Network error' });
    }
  })());
});

// Message API (from page)
self.addEventListener('message', (evt) => {
  const msg = evt.data;
  if (!msg) return;

  if (msg === 'skipWaiting') {
    self.skipWaiting();
    return;
  }

  if (msg === 'downloadOffline') {
    // Pre-cache everything in APP_SHELL + try to cache any not-yet-cached resources
    evt.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedRequests = await cache.keys();
      const cachedUrls = cachedRequests.map(r => new URL(r.url).pathname);
      const toCache = APP_SHELL.filter(path => !cachedUrls.includes(path));
      for (const url of toCache) {
        await cacheAddSafe(cache, url);
      }
      console.log('[SW] downloadOffline completed, cached:', toCache);
    })());
    return;
  }
});

// optional: push notification support (placeholder)
self.addEventListener('push', (evt) => {
  let body = 'You have a new message';
  try {
    const data = evt.data ? evt.data.json() : {};
    if (data.body) body = data.body;
  } catch (e) {}
  evt.waitUntil(self.registration.showNotification('KeepSafe', {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  }));
});



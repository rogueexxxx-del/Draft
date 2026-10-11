// Distraction-free custom service worker for Draft PWA
const CACHE_NAME = 'draft-v2';
const ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/Redaction-Regular.otf',
  '/fonts/Redaction35-Regular.otf',
  '/draft.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard non-GET requests (e.g. Supabase POST/PATCH)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Pages and Next navigation payloads must pick up the current build.
  if (event.request.mode === 'navigate' || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy)));
        }
        return networkResponse;
      }).catch(async () => {
        return await caches.match(event.request) || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache valid successful network responses for same-origin resources
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          event.request.url.startsWith(self.location.origin)
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Gracefully handle offline states if asset not found
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

const CACHE_NAME = 'homehub-cache-v4.3.3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Régi cache törlése:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass API, Auth and WebSocket calls directly to network
  if (
    event.request.url.includes('/rest/v1') ||
    event.request.url.includes('/auth/v1') ||
    event.request.url.includes('/realtime') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('version.json')
  ) {
    return;
  }

  // NetworkFirst for HTML/JS/CSS to detect new deployments
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

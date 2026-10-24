self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('nomadsync-v1').then((cache) => {
      return cache.addAll([
        './index.html',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

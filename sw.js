self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('app-v1').then(function(cache) {
      return cache.addAll([
        '/app-saude-uber/',
        '/app-saude-uber/index.html',
        '/app-saude-uber/style.css',
        '/app-saude-uber/firebase-init.js',
        '/app-saude-uber/app.js',
        '/app-saude-uber/manifest.json'
      ]);
    })
  );
});
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

const CACHE = 'monai-v5';
const ASSETS = ['/MonAi/', '/MonAi/index.html', '/MonAi/manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE }).map(function(k){ return caches.delete(k) })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Solo cachea assets estaticos, nunca interfiere con el storage
  var url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone) });
          return res;
        });
      })
    );
    return;
  }
  // Para el HTML siempre intenta la red primero para tener la version mas nueva
  if (url.includes('index.html') || url.endsWith('/MonAi/') || url.endsWith('/MonAi')) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone) });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // Para el resto, cache con fallback a red
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});

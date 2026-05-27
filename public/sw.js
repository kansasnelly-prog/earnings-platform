self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }
  event.respondWith(
    caches.open('earnings-cache').then((cache) => {
      return cache.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
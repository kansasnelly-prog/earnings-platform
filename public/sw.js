self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }
  // Bypass third‑party ad scripts to avoid fetch crashes
  if (event.request.url.includes('googlesyndication.com') || event.request.url.includes('pagead')) {
    return;
  }
  if (event.request.method !== 'GET') {
    return; // Do not attempt to cache POST, HEAD, PUT, or DELETE requests
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

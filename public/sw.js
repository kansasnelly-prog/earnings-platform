// Service Worker for Web Push Notifications
// This service worker handles push notifications and notification clicks

// Use date-based cache version to force cache invalidation on deployment (not per refresh)
// This ensures cache only invalidates when the service worker file changes (deployment)
const CACHE_VERSION = '2025-05-23-v3';
const CACHE_NAME = `earnings-ink-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = 'earnings-ink-static-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - skip waiting to activate new worker immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION);
  // Skip waiting to activate new worker immediately without page refresh
  self.skipWaiting();
});

// Activate event - clean up ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      
      // Delete ALL old caches - aggressive purge to prevent stale asset serving
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ALL caches except the current one
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Aggressively deleting cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  
  // Skip waiting to ensure new worker takes control immediately
  self.skipWaiting();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New message from customer support',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      conversationId: data.conversationId || null
    },
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/badge-72x72.png'
      }
    ],
    tag: 'earnings-ink-chat-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Earnings.ink', options)
  );
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  // Open the chat or default URL
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window with the target URL is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fetch event - handle network requests with safe fallback logic
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker entirely for:
  // 1. Non-GET requests (POST, PUT, DELETE, etc.) - Cache API doesn't support them
  // 2. API requests
  // 3. Supabase requests
  // 4. WebSocket connections
  // 5. JavaScript modules and assets (to prevent serving stale hashed chunks)
  // 6. CSS files (to prevent serving stale styles)
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.pathname.match(/\.(js|css|map)$/) ||
    url.pathname.includes('/assets/')
  ) {
    // Pass through to network WITHOUT any caching
    // This prevents serving stale hashed chunks during deployments
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error('[SW] Network fetch failed, returning error response:', error);
        return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // For navigation requests (HTML pages), use network-first with cache fallback
  // This ensures users always get the latest version of the app
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the successful response for offline use
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache due to network failure');
              return cachedResponse;
            }
            // No cache available, return offline fallback
            console.log('[SW] No cache available, returning offline page');
            return caches.match('/index.html').then((indexResponse) => {
              return indexResponse || new Response('Offline - No cached version available', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // For static assets (images, icons, manifest), use cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Cache hit - return response
          return cachedResponse;
        }
        // Cache miss - fetch from network and cache
        return fetch(event.request)
          .then((response) => {
            // Only cache successful GET responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed for static asset:', error);
            // Never reject FetchEvent without Response - return error response
            return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

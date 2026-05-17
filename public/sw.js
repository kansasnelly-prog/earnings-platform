// Service Worker for Web Push Notifications
// This service worker handles push notifications and notification clicks

// Use timestamp-based cache version to force cache invalidation on each deployment
const CACHE_VERSION = new Date().toISOString().split('T')[0];
const CACHE_NAME = `earnings-ink-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = 'earnings-ink-static-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches except the static cache
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
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

// Fetch event - handle network requests with safer caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for:
  // 1. JavaScript modules (index-*.js, vendor-*.js, etc.)
  // 2. API requests
  // 3. Supabase requests
  // 4. WebSocket connections
  if (
    url.pathname.match(/\.(js|css|map)$/) ||
    url.pathname.includes('/assets/') ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    // For dynamic assets, use network-first with fallback
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets (HTML, images, icons), use cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Cache hit - return response
          return response;
        }
        // Cache miss - fetch from network and cache
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
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
            console.error('[SW] Fetch failed:', error);
            throw error;
          });
      })
  );
});

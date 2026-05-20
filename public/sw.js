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

// Fetch event - handle network requests with NO caching for dynamic assets
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
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets (HTML, images, icons, manifest), use cache-first with network fallback
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
            // Only cache successful GET responses
            if (response && response.status === 200 && event.request.method === 'GET') {
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

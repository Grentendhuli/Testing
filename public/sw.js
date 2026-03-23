// LandlordBot Service Worker for PWA
// BUILD TIMESTAMP: 2025-03-19-1200
// VERSION: v4.2-windows-pwa-support

const CACHE_NAME = 'landlordbot-v4-2025-03-19-1200';
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/signup',
  '/auth/callback',
  '/index.html',
  '/manifest.json'
];

// Microsoft Graph API for Windows integration (placeholder)
const isWindows = /windows/i.test(navigator.userAgent);

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing with cache:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  
  // Wait for pages to close before activating new service worker
  // This prevents data loss during updates
  // self.skipWaiting();
});

// Fetch event - network first strategy with fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Supabase requests - they need fresh data
  if (request.url.includes('supabase.co') || request.url.includes('supabase')) {
    return;
  }
  
  // Skip analytics and tracking
  if (request.url.includes('googletagmanager.com') || 
      request.url.includes('google-analytics')) {
    return;
  }
  
  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached index.html if network fails
          return caches.match('/index.html') || caches.match(request);
        })
    );
    return;
  }
  
  // For assets (js, css, images) - cache first with network fallback
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Update cache in background
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
            }).catch(() => {}); // Ignore network errors for background update
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) return response;
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            });
        })
        .catch(() => {
          // All failed, return nothing (will trigger onerror handlers)
          return new Response('', { status: 404, statusText: 'Offline' });
        })
    );
    return;
  }
  
  // Default: network first then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
  
  // Keep sync registration for background sync (optional feature)
  if ('sync' in self.registration) {
    // Register for sync when available
    self.registration.sync.register('sync-payments').catch(() => {
      // Silent fail - sync not supported
    });
  }
});

// Message handling from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push notifications (placeholder for future implementation)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'landlordbot-notification',
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Close' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'LandlordBot',
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    // Placeholder for handling offline payment recording
    console.log('[SW] Background sync triggered for payments');
  }
});

// Windows-specific: Handle share target (if implemented)
if ('shareTarget' in navigator) {
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname === '/share-target') {
      // Handle incoming shared content
      event.respondWith(
        (async () => {
          const formData = await event.request.formData();
          const title = formData.get('title') || 'Shared content';
          const text = formData.get('text') || '';
          
          // Send message to all clients
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach((client) => {
            client.postMessage({
              type: 'SHARE_RECEIVED',
              title,
              text
            });
          });
          
          return Response.redirect('/dashboard', 303);
        })()
      );
    }
  });
}

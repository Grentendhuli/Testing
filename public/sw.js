/**
 * LandlordBot Service Worker v6.0
 * Production-grade caching with offline support
 * Following Workbox strategy patterns
 */

const CACHE_VERSION = 'v7';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,      // Critical assets - 24h TTL
  assets: `${CACHE_VERSION}-assets`,     // JS/CSS bundles - 7 days TTL
  api: `${CACHE_VERSION}-api`,            // API responses - 5 min TTL
  images: `${CACHE_VERSION}-images`,      // Images - 30 days TTL
  fonts: `${CACHE_VERSION}-fonts`,         // Fonts - 1 year TTL
  offline: `${CACHE_VERSION}-offline`      // Offline fallback
};

const CACHE_LIMITS = {
  [CACHE_NAMES.static]: 20,
  [CACHE_NAMES.assets]: 100,
  [CACHE_NAMES.api]: 50,
  [CACHE_NAMES.images]: 200,
  [CACHE_NAMES.fonts]: 50,
  [CACHE_NAMES.offline]: 10
};

const TTL = {
  [CACHE_NAMES.static]: 24 * 60 * 60 * 1000,        // 24 hours
  [CACHE_NAMES.assets]: 7 * 24 * 60 * 60 * 1000,     // 7 days
  [CACHE_NAMES.api]: 5 * 60 * 1000,                   // 5 minutes
  [CACHE_NAMES.images]: 30 * 24 * 60 * 60 * 1000,    // 30 days
  [CACHE_NAMES.fonts]: 365 * 24 * 60 * 60 * 1000     // 1 year
};

// Precache critical assets on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW v6] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW v6] Precaching critical assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW v6] Precache complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW v6] Precache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW v6] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('[SW v6] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW v6] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - apply different strategies based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching (but allow through)
  if (request.method !== 'GET') {
    return;
  }
  
  // Strategy: Network First for API calls (Supabase)
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
    return;
  }
  
  // Strategy: Cache First for fonts
  if (isFontRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.fonts));
    return;
  }
  
  // Strategy: Stale While Revalidate for static assets
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidateStrategy(event, request, CACHE_NAMES.assets));
    return;
  }
  
  // Strategy: Stale While Revalidate for images
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(event, request, CACHE_NAMES.images));
    return;
  }
  
  // Default: Network First with cache fallback
  event.respondWith(networkFirstStrategy(request, CACHE_NAMES.static));
});

// Network First Strategy - Try network first, fall back to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await enforceCacheLimit(cacheName);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW v6] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If offline and it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache First Strategy - Use cache, fetch only if missing
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await enforceCacheLimit(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW v6] Cache first failed:', error);
    throw error;
  }
}

// Stale While Revalidate Strategy - Serve cache, update in background
async function staleWhileRevalidateStrategy(event, request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName)
          .then((cache) => {
            cache.put(request, networkResponse.clone());
            return enforceCacheLimit(cacheName);
          });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW v6] Background fetch failed:', error);
    });
  
  // Always wait for fetch to complete
  event.waitUntil(fetchPromise);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  return fetchPromise;
}

// LRU Cache Eviction
async function enforceCacheLimit(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const limit = CACHE_LIMITS[cacheName] || 100;
  
  if (requests.length > limit) {
    const toDelete = requests.slice(0, requests.length - limit);
    await Promise.all(toDelete.map((request) => cache.delete(request)));
    console.log('[SW v6] Evicted', toDelete.length, 'entries from', cacheName);
  }
}

// Request type helpers
function isAPIRequest(url) {
  return url.hostname.includes('supabase.co') ||
         url.pathname.startsWith('/api/') ||
         url.hostname.includes('workers.dev');
}

function isFontRequest(url) {
  return url.hostname === 'fonts.gstatic.com' ||
         url.pathname.match(/\.(woff2?|ttf|otf|eot)$/);
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|json)$/);
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpe?g|gif|svg|webp|ico)$/);
}

// Background Sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    console.log('[SW v6] Background sync triggered');
    event.waitUntil(syncOfflineMutations());
  }
});

async function syncOfflineMutations() {
  // Notify all clients to process their offline queues
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
  });
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.type === 'GET_QUEUE_STATUS') {
    event.ports[0].postMessage({ status: 'ready' });
  }
  
  if (data.type === 'CLEAR_CACHE') {
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => event.ports[0].postMessage({ cleared: true }));
  }
});

console.log('[SW v6] Service Worker registered');

// LandlordBot Service Worker for PWA
// BUILD TIMESTAMP: 2025-03-11T20:00:00-04:00
// VERSION: v4.1-auth-fix

const CACHE_NAME = 'landlordbot-v4-2025-03-11-2000';
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/signup',
  '/auth/callback',
  '/index.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching version', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  // Skip Supabase requests
  if (request.url.includes('supabase.co') || request.url.includes('supabase')) return;
  
  // Navigation requests - always network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  
  // For assets, network first then cache
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

// Activate event
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
});
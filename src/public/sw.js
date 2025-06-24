// sw.js - Service Worker Sederhana untuk Testing
const CACHE_NAME = 'dicoding-story-v1';

// Install event - hanya cache yang penting
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caching essential files');
        // Hanya cache file essential
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]);
      })
      .then(function() {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('Service Worker install failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - minimal interference
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - let them pass through normally
  if (event.request.url.includes('story-api.dicoding.dev')) {
    return;
  }

  // For CSS, JS, and external resources - always try network first
  if (event.request.url.includes('.css') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('unpkg.com') ||
      event.request.url.includes('styles/') ||
      event.request.url.includes('scripts/')) {
    return; // Let these load normally without interference
  }

  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          // If network fails, return cached index
          return caches.match('/') || caches.match('/index.html');
        })
    );
  }
});

// Push notification handling (existing code)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New story added!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Dicoding Story', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
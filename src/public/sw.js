// sw.js - Service Worker
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
    self.clients.openWindow('/') // Tambahkan 'self.' di depan clients
  );
});
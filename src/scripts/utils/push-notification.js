// src/scripts/utils/push-notification.js
const BASE = 'https://story-api.dicoding.dev/v1';

export class PushNotificationService {
  constructor() {
    // VAPID key dari dokumentasi API
    this.vapidPublicKey = 'BCCs2eonMI-6H2ctvFaNg-UYdDv387Vno_bzUzALpB442r21CnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    this.subscription = null;
  }

  async getVapidPublicKey() {
    // Return hardcoded VAPID key dari dokumentasi
    return this.vapidPublicKey;
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Cek apakah sudah terdaftar
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          console.log('Service Worker already registered:', registrations[0]);
          return registrations[0];
        }
        
        // Register baru jika belum ada
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered by PushNotificationService:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Worker not supported');
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async subscribeToPushNotifications() {
    try {
      const registration = await this.registerServiceWorker();
      const hasPermission = await this.requestNotificationPermission();
      
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      const vapidPublicKey = await this.getVapidPublicKey();
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Send subscription to server menggunakan endpoint yang benar
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Push notification subscription successful');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('story_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log('=== SENDING SUBSCRIPTION TO SERVER ===');
      console.log('Endpoint:', subscription.endpoint);
      
      // Coba beberapa format endpoint yang mungkin benar
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
        }
      };
      
      console.log('Subscription data:', subscriptionData);

      // Coba endpoint utama dulu
      let response;
      try {
        response = await fetch(`${BASE}/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(subscriptionData)
        });
      } catch (error) {
        console.log('Primary endpoint failed, trying alternative...');
        
        // Coba endpoint alternatif
        response = await fetch(`${BASE}/push/subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(subscriptionData)
        });
      }

      console.log('Subscription response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Subscription error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to send subscription to server`);
      }

      const responseData = await response.json();
      console.log('Subscription success response:', responseData);
      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  async checkSubscription() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    }
    return null;
  }

  // TAMBAHAN: Unsubscribe function
  async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('No subscription to unsubscribe');
        return;
      }

      // Unsubscribe dari browser
      await subscription.unsubscribe();
      console.log('Unsubscribed from browser successfully');

      // Unsubscribe dari server
      await this.removeSubscriptionFromServer(subscription);
      
      console.log('Push notification unsubscription successful');
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // TAMBAHAN: Remove subscription dari server
  async removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem('story_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log('=== REMOVING SUBSCRIPTION FROM SERVER ===');
      
      const response = await fetch(`${BASE}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      console.log('Unsubscribe response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Unsubscribe error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to remove subscription from server`);
      }

      const responseData = await response.json();
      console.log('Unsubscribe success response:', responseData);
      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }
}

export default new PushNotificationService();
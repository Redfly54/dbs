import AddStoryModel from '../model/AddStoryModel.js';
import { loadConfig } from '../utils/index.js';
import AddStoryView from '../view/AddStoryView.js';

export default class AddStoryPresenter {
  constructor() {
    this.model = new AddStoryModel();  // Use AddStoryModel to handle the API
    this.view = new AddStoryView();    // Use AddStoryView for the view rendering
  }

  async init() {
    // Check if the user is logged in by checking the token
    if (!this.model.token) {
      this.view.showLoginRequired();
      return;
    }

    try {
      // Load configuration data (e.g., Maptiler API key)
      const { maptilerKey } = await loadConfig();
      
      // Render the view and pass the maptilerKey to it
      this.view.render(async ({ photo, description, lat, lon }) => {
        try {
          // Call the model to add the story
          await this.model.addStory({ photo, description, lat, lon });
          
          // TAMBAHAN: Trigger manual push notification setelah add story
          try {
            await this.sendPushNotification(description);
          } catch (pushError) {
            console.warn('Failed to send push notification:', pushError);
            // Don't fail the whole operation if push fails
          }
          
          this.view.showSuccess();
        } catch (err) {
          this.view.showError(err.message);
        }
      }, maptilerKey);
    } catch (err) {
      this.view.showConfigError(err.message);
    }
  }

  // Method untuk kirim push notification
  async sendPushNotification(description) {
    const token = localStorage.getItem('story_token');
    if (!token) return;

    try {
      // Coba beberapa endpoint yang mungkin benar
      const possibleEndpoints = [
        '/notifications/send',
        '/notifications/push', 
        '/push/send',
        '/push/notifications'
      ];

      let success = false;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying push endpoint: ${endpoint}`);
          
          const response = await fetch(`https://story-api.dicoding.dev/v1${endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: "Story Baru Ditambahkan!",
              options: {
                body: `Ada story baru: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
              }
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log(`Push notification sent successfully via ${endpoint}:`, responseData);
            success = true;
            break;
          } else {
            console.log(`Endpoint ${endpoint} failed with status ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} error:`, endpointError.message);
        }
      }

      if (!success) {
        console.warn('All push notification endpoints failed');
        // Fallback: Local notification jika server tidak support
        await this.sendLocalNotification(description);
      }
    } catch (error) {
      console.warn('Push notification error:', error);
      // Fallback: Local notification
      await this.sendLocalNotification(description);
    }
  }

  // Fallback: Local notification jika server tidak support push
  async sendLocalNotification(description) {
    try {
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Story Baru Ditambahkan!', {
          body: `Ada story baru: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [100, 50, 100],
          data: {
            url: '/#/stories',
            timestamp: Date.now()
          },
          actions: [
            { action: 'view', title: 'Lihat Stories' },
            { action: 'dismiss', title: 'Tutup' }
          ]
        });
        console.log('Local notification sent successfully');
      }
    } catch (localError) {
      console.warn('Local notification also failed:', localError);
    }
  }
}
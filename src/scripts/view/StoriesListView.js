// js/view/StoriesListView.js
import IndexedDBHandler from '../utils/indexeddb-handler.js';
import PushNotificationService from '../utils/push-notification.js';

export default class StoriesListView {
  constructor() {
    console.log('StoriesListView constructor called'); // DEBUG
    this.app = document.getElementById('app');
    console.log('StoriesListView app element:', this.app); // DEBUG
    
    if (!this.app) {
      console.error('CRITICAL: app element not found in StoriesListView constructor!');
    }
    console.log('StoriesListView constructor completed'); // DEBUG
  }

  cleanup() {
    // Check if there's a stream and stop it
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;  // Reset the stream after stopping it
    }
  }

  async render(stories, mapKey) {
    try {
      console.log('=== StoriesListView.render START ==='); // DEBUG
      console.log('StoriesListView.render called with', stories.length, 'stories'); // DEBUG
      
      // Set HTML first
      console.log('Setting innerHTML...'); // DEBUG
      this.app.innerHTML = `
        <h2>All Stories</h2>
        <div id="push-notification-section" style="margin-bottom: 1rem;">
          <button id="enablePushBtn" style="display: none;">Enable Push Notifications</button>
          <p id="pushStatus" style="color: #666; font-size: 0.9rem;">Push notifications loading...</p>
        </div>
        <div id="stories-list" class="stories-grid"></div>
        <h3>Map</h3>
        <div id="map-list" style="width:100%;height:400px;"></div>
      `;
      console.log('innerHTML set successfully'); // DEBUG

      // 1) PRIORITAS UTAMA: Render daftar cerita DULU (tanpa await push notification)
      console.log('Getting stories-list element...'); // DEBUG
      const listEl = document.getElementById('stories-list');
      
      if (!listEl) {
        console.error('stories-list element not found!');
        return;
      }
      console.log('stories-list element found:', listEl); // DEBUG

      console.log('Rendering stories to DOM...'); // DEBUG
      
      stories.forEach((s, index) => {
        try {
          console.log(`Adding story ${index + 1}: ${s.name}`); // DEBUG
          const item = document.createElement('div');
          item.className = 'story-item';
          item.innerHTML = `
            <img src="${s.photoUrl}" alt="Foto Story" width="200" />
            <h4>${s.name}</h4>
            <p>${s.description}</p>
            <small>${new Date(s.createdAt).toLocaleString()}</small>
            <div style="padding: 0.5rem; border-top: 1px solid #eee; margin-top: 0.5rem;">
              <button 
                class="bookmark-btn" 
                data-story='${JSON.stringify(s).replace(/'/g, "&apos;")}'
                style="background: #17a2b8; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.85rem; width: 100%;"
              >
                🔖 Bookmark Story
              </button>
            </div>
          `;
          listEl.appendChild(item);
          console.log(`Story ${index + 1} added successfully`); // DEBUG
        } catch (itemError) {
          console.error(`Error adding story ${index + 1}:`, itemError);
        }
      });

      // Setup bookmark functionality
      this.setupBookmarkButtons();

      console.log('Stories rendered successfully! Total:', listEl.children.length); // DEBUG

      // 2) Push notification setup (TIDAK MENGGANGGU stories rendering)
      console.log('Setting up push notifications (async)...'); // DEBUG
      this.setupPushNotificationsAsync();

      // 3) Map initialization (TIDAK MENGGANGGU stories rendering)
      console.log('Setting up map (async)...'); // DEBUG
      this.setupMapAsync(stories, mapKey);

      console.log('=== StoriesListView.render COMPLETED ==='); // DEBUG
    } catch (renderError) {
      console.error('=== CRITICAL ERROR in StoriesListView.render ===', renderError);
      // Fallback rendering
      this.app.innerHTML = `
        <h2>All Stories</h2>
        <p>Error loading stories view. Stories data available: ${stories.length} items</p>
        <div id="fallback-stories"></div>
      `;
      
      // Try simple fallback rendering
      const fallback = document.getElementById('fallback-stories');
      if (fallback && stories.length > 0) {
        stories.forEach(s => {
          const simple = document.createElement('div');
          simple.innerHTML = `<p><strong>${s.name}</strong>: ${s.description}</p>`;
          fallback.appendChild(simple);
        });
      }
    }
  }

  // Setup bookmark button functionality
  setupBookmarkButtons() {
    const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
    bookmarkButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
          const storyData = JSON.parse(button.dataset.story);
          
          // Check if already bookmarked
          const isBookmarked = await IndexedDBHandler.isBookmarked(storyData.id);
          if (isBookmarked) {
            this.showToast('Story already bookmarked!', 'warning');
            return;
          }
          
          // Disable button during process
          button.disabled = true;
          button.textContent = '📚 Saving...';
          
          // Save to IndexedDB
          await IndexedDBHandler.saveBookmark(storyData);
          
          // Update button
          button.style.background = '#28a745';
          button.textContent = '✓ Bookmarked';
          
          this.showToast('Story bookmarked successfully!', 'success');
          
          // Reset button after delay
          setTimeout(() => {
            button.disabled = false;
            button.style.background = '#17a2b8';
            button.textContent = '🔖 Bookmark Story';
          }, 2000);
          
        } catch (error) {
          console.error('Error bookmarking story:', error);
          button.disabled = false;
          button.textContent = '🔖 Bookmark Story';
          this.showToast('Failed to bookmark story: ' + error.message, 'error');
        }
      });
    });
  }

  // Async push notification setup (menggunakan PushNotificationService)
  async setupPushNotificationsAsync() {
    try {
      console.log('Push notification setup starting...'); // DEBUG
      const enableBtn = document.getElementById('enablePushBtn');
      const statusText = document.getElementById('pushStatus');

      if (!enableBtn || !statusText) {
        console.warn('Push notification elements not found');
        return;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        statusText.textContent = 'Push notifications not supported';
        console.log('Push notifications not supported'); // DEBUG
        return;
      }

      if (Notification.permission === 'denied') {
        statusText.textContent = 'Push notifications blocked';
        console.log('Push notifications blocked'); // DEBUG
        return;
      }

      // Cek apakah sudah ada subscription
      try {
        const subscription = await PushNotificationService.checkSubscription();
        
        if (subscription) {
          // Sudah subscribed - tampilkan status dan tombol unsubscribe
          statusText.innerHTML = '✓ Push notifications enabled <button id="unsubscribeBtn" style="margin-left: 10px; font-size: 0.8em;">Disable</button>';
          statusText.style.color = '#28a745';
          console.log('Push notifications already enabled'); // DEBUG
          
          // Setup unsubscribe button
          const unsubscribeBtn = document.getElementById('unsubscribeBtn');
          if (unsubscribeBtn) {
            unsubscribeBtn.addEventListener('click', async () => {
              try {
                unsubscribeBtn.disabled = true;
                unsubscribeBtn.textContent = 'Disabling...';
                
                await PushNotificationService.unsubscribeFromPushNotifications();
                
                // Reset UI
                statusText.innerHTML = 'Push notifications available';
                statusText.style.color = '#666';
                enableBtn.style.display = 'inline-block';
                console.log('Push notifications disabled successfully'); // DEBUG
              } catch (error) {
                console.error('Failed to disable push notifications:', error);
                unsubscribeBtn.disabled = false;
                unsubscribeBtn.textContent = 'Disable';
                statusText.innerHTML = `Failed to disable: ${error.message} <button id="unsubscribeBtn" style="margin-left: 10px; font-size: 0.8em;">Retry</button>`;
                statusText.style.color = '#dc3545';
              }
            });
          }
        } else {
          // Belum subscribed - tampilkan tombol enable
          enableBtn.style.display = 'inline-block';
          statusText.textContent = 'Get notified when new stories are added';
          
          enableBtn.addEventListener('click', async () => {
            try {
              enableBtn.disabled = true;
              enableBtn.textContent = 'Enabling...';
              
              await PushNotificationService.subscribeToPushNotifications();
              
              // Update UI setelah berhasil subscribe
              enableBtn.style.display = 'none';
              statusText.innerHTML = '✓ Push notifications enabled <button id="unsubscribeBtn" style="margin-left: 10px; font-size: 0.8em;">Disable</button>';
              statusText.style.color = '#28a745';
              console.log('Push notifications enabled successfully'); // DEBUG
              
              // Setup unsubscribe button untuk yang baru di-enable
              const unsubscribeBtn = document.getElementById('unsubscribeBtn');
              if (unsubscribeBtn) {
                unsubscribeBtn.addEventListener('click', async () => {
                  try {
                    unsubscribeBtn.disabled = true;
                    unsubscribeBtn.textContent = 'Disabling...';
                    
                    await PushNotificationService.unsubscribeFromPushNotifications();
                    
                    // Reset UI
                    statusText.innerHTML = 'Push notifications available';
                    statusText.style.color = '#666';
                    enableBtn.style.display = 'inline-block';
                    enableBtn.disabled = false;
                    enableBtn.textContent = 'Enable Push Notifications';
                  } catch (error) {
                    console.error('Failed to disable push notifications:', error);
                    unsubscribeBtn.disabled = false;
                    unsubscribeBtn.textContent = 'Disable';
                  }
                });
              }
            } catch (error) {
              console.error('Failed to enable push notifications:', error);
              enableBtn.disabled = false;
              enableBtn.textContent = 'Enable Push Notifications';
              statusText.textContent = `Failed to enable: ${error.message}`;
              statusText.style.color = '#dc3545';
            }
          });
        }
      } catch (checkError) {
        console.error('Error checking subscription:', checkError);
        enableBtn.style.display = 'inline-block';
        statusText.textContent = 'Push notifications available';
        
        enableBtn.addEventListener('click', async () => {
          try {
            enableBtn.disabled = true;
            enableBtn.textContent = 'Enabling...';
            
            await PushNotificationService.subscribeToPushNotifications();
            
            enableBtn.style.display = 'none';
            statusText.innerHTML = '✓ Push notifications enabled <button id="unsubscribeBtn" style="margin-left: 10px; font-size: 0.8em;">Disable</button>';
            statusText.style.color = '#28a745';
          } catch (error) {
            console.error('Failed to enable push notifications:', error);
            enableBtn.disabled = false;
            enableBtn.textContent = 'Enable Push Notifications';
            statusText.textContent = `Failed to enable: ${error.message}`;
            statusText.style.color = '#dc3545';
          }
        });
      }

      console.log('Push notification setup completed'); // DEBUG
    } catch (error) {
      console.error('Push notification setup failed (non-critical):', error);
      const statusText = document.getElementById('pushStatus');
      if (statusText) {
        statusText.textContent = 'Push notifications unavailable';
      }
    }
  }

  // Async map setup (tidak mengganggu main rendering)
  async setupMapAsync(stories, mapKey) {
    try {
      console.log('Map setup starting...'); // DEBUG
      
      // Add small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          maplibregl.accessToken = mapKey;
          const map = new maplibregl.Map({
            container: 'map-list',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${mapKey}`,
            center: [106.8272, -6.1751],
            zoom: 5,
          });

          let marker;
          // Add markers for each story on the map
          stories.forEach(s => {
            const { lat, lon } = s;
            if (lat && lon) {
              marker = new maplibregl.Marker()
                .setLngLat([lon, lat])
                .addTo(map);

              const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`
                  <strong>${s.name}</strong><br>
                  ${s.description}<br>
                  <img src="${s.photoUrl}" width="100" />
                `);
              
              marker.setPopup(popup);
            }
          });
          
          console.log('Map initialized successfully'); // DEBUG
        } catch (mapError) {
          console.error('Map initialization failed:', mapError);
          const mapContainer = document.getElementById('map-list');
          if (mapContainer) {
            mapContainer.innerHTML = '<p>Map unavailable</p>';
          }
        }
      }, 100);
    } catch (error) {
      console.error('Map setup failed (non-critical):', error);
    }
  }

  showLoginRequired() {
    alert('Anda harus login terlebih dahulu');
    location.hash = '/login';
  }

  showError(message) {
    alert(`Gagal memuat stories: ${message}`);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#dc3545' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1001;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}
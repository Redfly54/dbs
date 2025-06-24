// js/view/StoriesListView.js
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
          `;
          listEl.appendChild(item);
          console.log(`Story ${index + 1} added successfully`); // DEBUG
        } catch (itemError) {
          console.error(`Error adding story ${index + 1}:`, itemError);
        }
      });

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

  // Async push notification setup (tidak mengganggu main rendering)
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

      // Simple setup tanpa import PushNotificationService dulu
      statusText.textContent = 'Push notifications available';
      enableBtn.style.display = 'inline-block';
      enableBtn.textContent = 'Enable Push Notifications';
      
      enableBtn.addEventListener('click', () => {
        statusText.textContent = 'Push notifications feature coming soon!';
        enableBtn.style.display = 'none';
      });

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
}
// src/scripts/utils/offline-handler.js
export class OfflineHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineContent = document.getElementById('offline-content');
    this.mainApp = document.getElementById('app');
    
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateUI();
      this.showToast('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateUI();
      this.showToast('You are offline. Some features may not work.', 'warning');
    });
  }

  updateUI() {
    if (!this.isOnline) {
      // Show offline indicator in header
      this.showOfflineIndicator();
    } else {
      // Hide offline indicator
      this.hideOfflineIndicator();
    }
  }

  showOfflineIndicator() {
    // Add offline indicator to header if it doesn't exist
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = '⚠️ Offline mode';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        text-align: center;
        padding: 5px;
        font-size: 12px;
        z-index: 1000;
      `;
      document.body.insertBefore(indicator, document.body.firstChild);
      
      // Adjust body padding
      document.body.style.paddingTop = '30px';
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
      document.body.style.paddingTop = '0';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
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

  // Method to check if a request should be cached
  shouldCache(url) {
    // Don't cache API POST requests
    if (url.includes('story-api.dicoding.dev') && url.includes('POST')) {
      return false;
    }
    return true;
  }

  // Show offline fallback for specific content
  showOfflineFallback(contentType = 'general') {
    const app = document.getElementById('app');
    if (!app) return;

    let fallbackHTML = '';
    
    switch (contentType) {
      case 'stories':
        fallbackHTML = `
          <h2>Stories</h2>
          <div style="text-align: center; padding: 2rem; background: #f5f5f5; border-radius: 8px; margin: 1rem 0;">
            <h3>📱 You're offline</h3>
            <p>Stories require an internet connection to load.</p>
            <p>Please check your connection and try again.</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 8px 16px; background: #5E9EE2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Try Again
            </button>
          </div>
        `;
        break;
      case 'login':
        fallbackHTML = `
          <h2>Login</h2>
          <div style="text-align: center; padding: 2rem; background: #f5f5f5; border-radius: 8px; margin: 1rem 0;">
            <h3>📱 You're offline</h3>
            <p>Login requires an internet connection.</p>
            <p>Please check your connection and try again.</p>
          </div>
        `;
        break;
      default:
        fallbackHTML = `
          <div style="text-align: center; padding: 2rem;">
            <h2>📱 You're offline</h2>
            <p>Some features may not be available while offline.</p>
            <p>Please check your internet connection.</p>
          </div>
        `;
    }
    
    app.innerHTML = fallbackHTML;
  }

  // Check online status
  checkOnlineStatus() {
    return this.isOnline;
  }
}

export default new OfflineHandler();
// src/scripts/utils/pwa-install-handler.js
export class PWAInstallHandler {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.setupInstallPrompt();
  }

  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      this.deferredPrompt = e;
      // Show the install button
      this.showInstallButton();
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = document.createElement('button');
      this.installButton.id = 'pwa-install-btn';
      this.installButton.innerHTML = '📱 Install App';
      this.installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #5E9EE2;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(94, 158, 226, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
      `;
      
      // Add hover effect
      this.installButton.addEventListener('mouseenter', () => {
        this.installButton.style.background = '#4a8bc2';
        this.installButton.style.transform = 'translateY(-2px)';
      });
      
      this.installButton.addEventListener('mouseleave', () => {
        this.installButton.style.background = '#5E9EE2';
        this.installButton.style.transform = 'translateY(0)';
      });

      // Add click handler
      this.installButton.addEventListener('click', () => {
        this.handleInstallClick();
      });

      document.body.appendChild(this.installButton);
    }

    this.installButton.style.display = 'block';
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async handleInstallClick() {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    // Hide the install button
    this.hideInstallButton();

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      // Show button again after some time if user dismissed
      setTimeout(() => {
        if (this.deferredPrompt) {
          this.showInstallButton();
        }
      }, 60000); // Show again after 1 minute
    }

    // Clear the deferredPrompt
    this.deferredPrompt = null;
  }

  // Check if app is already installed
  isAppInstalled() {
    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Initialize PWA install handler
  init() {
    // Don't show install button if already installed
    if (this.isAppInstalled()) {
      console.log('App is already installed');
      return;
    }

    // Check if browser supports installation
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('PWA features supported');
    } else {
      console.log('PWA features not fully supported');
    }
  }
}

export default new PWAInstallHandler();
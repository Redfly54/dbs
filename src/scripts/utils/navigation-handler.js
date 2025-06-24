// src/scripts/utils/navigation-handler.js
export class NavigationHandler {
  constructor() {
    this.guestNav = document.getElementById('guest-nav');
    this.userNav = document.getElementById('user-nav');
    this.logoutBtn = document.getElementById('logoutBtn');
    
    this.setupLogoutHandler();
    this.setupEventListeners();
  }

  updateNavigation() {
    const token = localStorage.getItem('story_token');
    
    if (token) {
      // User sudah login
      this.guestNav.style.display = 'none';
      this.userNav.style.display = 'block';
    } else {
      // User belum login
      this.guestNav.style.display = 'block';
      this.userNav.style.display = 'none';
    }
  }

  setupLogoutHandler() {
    this.logoutBtn.addEventListener('click', async () => {
      // Clear token dari localStorage
      localStorage.removeItem('story_token');
      
      // Clear token dari Model juga
      try {
        const Model = (await import('../model.js')).default;
        Model.token = null;
      } catch (e) {
        console.warn('Could not update Model token:', e);
      }
      
      // Update navigation UI immediately
      this.updateNavigation();
      
      // Show success message
      alert('Logout berhasil!');
      
      // Force redirect to login
      setTimeout(() => {
        location.hash = '/login';
      }, 100);
    });
  }

  setupEventListeners() {
    // Listen for login/logout events
    window.addEventListener('loginSuccess', () => {
      setTimeout(() => this.updateNavigation(), 50);
    });

    window.addEventListener('logoutSuccess', () => {
      setTimeout(() => this.updateNavigation(), 50);
    });

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'story_token') {
        setTimeout(() => this.updateNavigation(), 50);
      }
    });

    // HAPUS INI - ini yang menyebabkan loop
    // window.addEventListener('hashchange', () => {
    //   setTimeout(() => this.updateNavigation(), 50);
    // });
  }

  // Method untuk dipanggil setelah login berhasil
  onLoginSuccess() {
    this.updateNavigation();
  }

  // Method untuk dipanggil setelah logout
  onLogout() {
    this.updateNavigation();
  }
}

export default new NavigationHandler();
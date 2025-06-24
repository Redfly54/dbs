import Model from './model.js';
import AddStoryPresenter from './presenter/AddStoryPresenter.js';
import LoginPresenter from './presenter/LoginPresenter.js';
import RegisterPresenter from './presenter/RegisterPresenter.js';
import StoriesListPresenter from './presenter/StoriesListPresenter.js';
import StoryDetailPresenter from './presenter/StoryDetailPresenter.js';
import NavigationHandler from './utils/navigation-handler.js';
import OfflineHandler from './utils/offline-handler.js';
import PushNotificationService from './utils/push-notification.js';
import PWAInstallHandler from './utils/pwa-install-handler.js';

const routes = {
  '/login': () => {
    console.log('Executing login route'); // DEBUG
    return new LoginPresenter().init();
  },
  '/register': () => {
    console.log('Executing register route'); // DEBUG
    return new RegisterPresenter().init();
  },
  '/stories': () => {
    console.log('Executing stories route'); // DEBUG
    return new StoriesListPresenter().init();
  },
  '/stories/:id': (id) => {
    console.log('Executing story detail route with id:', id); // DEBUG
    return new StoryDetailPresenter(Model, id).init();
  },
  '/add': () => {
    console.log('Executing add story route'); // DEBUG
    return new AddStoryPresenter().init();
  },
};

function parseLocation() {
  // hilangkan leading '#' dan leading '/'
  const raw = location.hash.replace(/^#\/?/, '') || 'login';
  const segments = raw.split('/');
  const route = segments[0];          // 'login' atau 'register' atau 'stories'
  const id = segments[1] || null;
  return { path: `/${route}`, id };
}

function router() {
  const { path, id } = parseLocation();
  console.log('Router:', { path, id });

  // Check if route requires authentication - gunakan localStorage sebagai single source of truth
  const protectedRoutes = ['/stories', '/add'];
  const isProtectedRoute = protectedRoutes.some(route => path === route || path.startsWith(route));
  const token = localStorage.getItem('story_token');
  
  if (isProtectedRoute && !token) {
    alert('Anda harus login terlebih dahulu');
    location.hash = '/login';
    return;
  }

  // Redirect to stories if logged in user tries to access login/register
  if ((path === '/login' || path === '/register') && token) {
    location.hash = '/stories';
    return;
  }

  // Check offline status for network-dependent routes
  if (!OfflineHandler.checkOnlineStatus()) {
    const networkRoutes = ['/stories', '/add', '/login', '/register'];
    if (networkRoutes.includes(path)) {
      const contentType = path === '/stories' ? 'stories' : path === '/login' ? 'login' : 'general';
      OfflineHandler.showOfflineFallback(contentType);
      return;
    }
  }

  const route = Object.keys(routes).find(r => {
    if (r.includes('/:id')) {
      return r.split('/:')[0] === path;
    }
    return r === path;
  });
  console.log('  matched route:', route);

  if (route) {
    routes[route](id);
  } else {
    console.warn('Route not found, redirect to default');
    // Redirect berdasarkan status login
    const hasToken = localStorage.getItem('story_token');
    location.hash = hasToken ? '/stories' : '/login';
  }
}

function navigate() {
  // Sync Model.token dengan localStorage setiap kali navigate
  Model.token = localStorage.getItem('story_token');
  
  // Update navigation setiap kali navigate
  NavigationHandler.updateNavigation();
  
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      router();
    });
  } else {
    router();
  }
}

// Initialize push notifications when user is logged in
async function initializePushNotifications() {
  if (Model.token) {
    try {
      await PushNotificationService.subscribeToPushNotifications();
    } catch (error) {
      console.warn('Push notification setup failed:', error.message);
      // Don't block app if push notifications fail
    }
  }
}

// Setup push notifications after login
function setupPushNotificationsOnLogin() {
  // Monitor for successful login
  const originalLogin = Model.login;
  Model.login = async function(...args) {
    const result = await originalLogin.apply(this, args);
    // After successful login, setup push notifications
    setTimeout(() => initializePushNotifications(), 1000);
    return result;
  };
}

// Register Service Worker for PWA
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New version available');
            if (confirm('New version available! Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.log('Service Worker not supported');
  }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('load', async () => {
  // Sync Model.token dengan localStorage saat startup
  Model.token = localStorage.getItem('story_token');
  
  // Initialize navigation
  NavigationHandler.updateNavigation();
  
  // Initialize offline handler
  OfflineHandler;
  
  // Register Service Worker for PWA
  await registerServiceWorker();
  
  // Initialize PWA install handler
  PWAInstallHandler.init();
  
  // Jika tidak ada hash, set default berdasarkan login status
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    const token = localStorage.getItem('story_token');
    location.hash = token ? '/stories' : '/login';
    return; // navigate akan dipanggil oleh hashchange
  }
  
  setupPushNotificationsOnLogin();
  navigate();
});
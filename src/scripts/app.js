import Model from './model.js';
import AddStoryPresenter from './presenter/AddStoryPresenter.js';
import LoginPresenter from './presenter/LoginPresenter.js';
import RegisterPresenter from './presenter/RegisterPresenter.js';
import StoriesListPresenter from './presenter/StoriesListPresenter.js';
import StoryDetailPresenter from './presenter/StoryDetailPresenter.js';

const routes = {
  '/login': () => new LoginPresenter(Model).init(),
  '/register': () => new RegisterPresenter(Model).init(),
  '/stories': () => new StoriesListPresenter(Model).init(),
  '/stories/:id': (id) => new StoryDetailPresenter(Model, id).init(),
  '/add': () => new AddStoryPresenter(Model).init(),
};

function parseLocation() {
  // hilangkan leading '#' dan leading '/'
  const raw = location.hash.replace(/^#\/?/, '') || 'stories';
  const segments = raw.split('/');
  const route = segments[0];          // 'login' atau 'register' atau 'stories'
  const id = segments[1] || null;
  return { path: `/${route}`, id };
}

function router() {
  const { path, id } = parseLocation();
  console.log('Router:', { path, id });

  // const authRequired = ['/stories', '/stories/:id', '/add'];
  // if (authRequired.some(r => r.split('/:')[0] === path) && !Model.token) {
  //   alert('Silakan login terlebih dahulu');
  //   return location.hash = '/login';
  // }


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
    console.warn('Route not found, redirect to /stories');
    location.hash = '/stories';
  }
}


function navigate() {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      router();
    });
  } else {
    router();
  }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('load', navigate);

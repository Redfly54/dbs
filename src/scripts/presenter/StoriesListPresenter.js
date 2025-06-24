// js/presenter/StoriesListPresenter.js
// import { loadConfig } from '../utils/index.js';
// import StoriesListView from '../view/StoriesListView.js';

// export default class StoriesListPresenter {
//   constructor(model) {
//     this.model = model;
//     this.view = new StoriesListView();
//   }

//   async init() {

//     if (!this.model.token) {
//         alert('Anda harus login terlebih dahulu');
//         return location.hash = '/login';
//     }

//     try {
//       const { maptilerKey } = await loadConfig();
//       const { listStory: stories } = await this.model.getAllStories();
//       this.view.render(stories, maptilerKey);
//     } catch (err) {
      
//       console.error('Error loading stories or map config:', err);

//       alert(`Gagal memuat stories: ${err.message}`);
//     }
//   }
// }

import StoriesListModel from '../model/StoriesListModel.js';
import { loadConfig } from '../utils/index.js';
import StoriesListView from '../view/StoriesListView.js';

export default class StoriesListPresenter {
  constructor() {
    this.model = new StoriesListModel();  // Use the StoriesListModel to handle the API
    this.view = new StoriesListView();    // Use StoriesListView for rendering the stories
  }

  async init() {
    // Check if the user is logged in by checking the token
    if (!this.model.token) {
      alert('Anda harus login terlebih dahulu');
      return location.hash = '/login';  // Redirect to login if no token is found
    }

    try {
      // Load configuration (e.g., Maptiler API key)
      const { maptilerKey } = await loadConfig();
      
      // Fetch all stories using the model
      const { listStory: stories } = await this.model.getAllStories();

      // Pass the stories and maptilerKey to the view for rendering
      this.view.render(stories, maptilerKey);
    } catch (err) {
      // Handle errors in loading stories or map configuration
      console.error('Error loading stories or map config:', err);
      alert(`Gagal memuat stories: ${err.message}`);
    }
  }
}


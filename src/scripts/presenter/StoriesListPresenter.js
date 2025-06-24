import StoriesListModel from '../model/StoriesListModel.js';
import { loadConfig } from '../utils/index.js';
import StoriesListView from '../view/StoriesListView.js';

export default class StoriesListPresenter {
  constructor() {
    console.log('StoriesListPresenter constructor called'); // DEBUG
    this.model = new StoriesListModel();  // Use the StoriesListModel to handle the API
    this.view = new StoriesListView();    // Use StoriesListView for rendering the stories
    console.log('StoriesListPresenter constructor completed'); // DEBUG
  }

  async init() {
    console.log('StoriesListPresenter.init() started'); // DEBUG
    
    // Check if the user is logged in by checking the token
    console.log('Checking token:', this.model.token); // DEBUG
    
    if (!this.model.token) {
      console.log('No token found, showing login required'); // DEBUG
      this.view.showLoginRequired();
      return;
    }

    try {
      console.log('Loading config and stories...'); // DEBUG
      
      // Load configuration (e.g., Maptiler API key)
      const { maptilerKey } = await loadConfig();
      console.log('Config loaded, maptilerKey:', maptilerKey); // DEBUG
      
      // Fetch all stories using the model
      console.log('Fetching stories from API...'); // DEBUG
      const { listStory: stories } = await this.model.getAllStories();
      console.log('Stories fetched:', stories.length, 'items'); // DEBUG

      // Pass the stories and maptilerKey to the view for rendering
      console.log('Calling view.render()...'); // DEBUG
      await this.view.render(stories, maptilerKey);
      console.log('StoriesListPresenter.init() completed successfully'); // DEBUG
    } catch (err) {
      // Handle errors in loading stories or map configuration
      console.error('Error in StoriesListPresenter.init():', err); // DEBUG
      
      // Fallback: try to render minimal stories list
      console.log('Attempting fallback rendering...'); // DEBUG
      try {
        const app = document.getElementById('app');
        if (app) {
          app.innerHTML = `
            <h2>All Stories</h2>
            <p>Error: ${err.message}</p>
            <p>Please refresh the page or try again later.</p>
          `;
        }
      } catch (fallbackError) {
        console.error('Even fallback rendering failed:', fallbackError);
      }
      
      this.view.showError(err.message);
    }
  }
}
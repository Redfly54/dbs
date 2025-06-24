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
          this.view.showSuccess();
        } catch (err) {
          this.view.showError(err.message);
        }
      }, maptilerKey);
    } catch (err) {
      this.view.showConfigError(err.message);
    }
  }
}
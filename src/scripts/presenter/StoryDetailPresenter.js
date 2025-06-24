// js/presenter/StoryDetailPresenter.js
import { loadConfig } from '../utils/index.js';
import StoryDetailView from '../view/StoryDetailView.js';

export default class StoryDetailPresenter {
  constructor(model, storyId) {
    this.model = model;
    this.view = new StoryDetailView();
    this.storyId = storyId;
  }

  async init() {
    if (!this.model.token) {
      this.view.showLoginRequired();
      return;
    }
    
    try {
      const { maptilerKey } = await loadConfig();
      const { story } = await this.model.getStory(this.storyId);
      this.view.render(story, maptilerKey);
    } catch (err) {
      this.view.showError(err.message);
    }
  }
}
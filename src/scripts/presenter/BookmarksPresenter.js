// src/scripts/presenter/BookmarksPresenter.js
import IndexedDBHandler from '../utils/indexeddb-handler.js';
import BookmarksView from '../view/BookmarksView.js';

export default class BookmarksPresenter {
  constructor() {
    this.view = new BookmarksView();
    this.dbHandler = IndexedDBHandler;
  }

  async init() {
    // Check login status
    const token = localStorage.getItem('story_token');
    if (!token) {
      this.view.showLoginRequired();
      return;
    }

    try {
      console.log('Loading bookmarked stories...');
      
      // Initialize IndexedDB
      await this.dbHandler.initDB();
      
      // Get all bookmarks
      const bookmarks = await this.dbHandler.getAllBookmarks();
      
      // Sort by bookmark date (newest first)
      bookmarks.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));
      
      console.log('Bookmarks loaded:', bookmarks.length);
      
      // Render view
      this.view.render(bookmarks, async (storyId) => {
        await this.removeBookmark(storyId);
      });
      
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.view.showError(error.message);
    }
  }

  async removeBookmark(storyId) {
    try {
      await this.dbHandler.removeBookmark(storyId);
      console.log('Bookmark removed:', storyId);
      
      // Show success message
      this.showToast('Bookmark removed successfully', 'success');
      
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
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
}
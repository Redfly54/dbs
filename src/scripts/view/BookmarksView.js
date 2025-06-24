// src/scripts/view/BookmarksView.js
export default class BookmarksView {
  constructor() {
    this.app = document.getElementById('app');
  }

  render(bookmarks, onRemoveBookmark) {
    this.app.innerHTML = `
      <h2>Bookmarked Stories</h2>
      <p style="color: #666; margin-bottom: 1rem;">Stories you've bookmarked for offline reading</p>
      
      ${bookmarks.length === 0 ? this.renderEmptyState() : this.renderBookmarksList(bookmarks)}
    `;

    // Setup event listeners untuk remove bookmark
    if (bookmarks.length > 0) {
      this.setupRemoveListeners(onRemoveBookmark);
    }
  }

  renderEmptyState() {
    return `
      <div class="empty-bookmarks">
        <h3>📚 No Bookmarks Yet</h3>
        <p>Start bookmarking stories to read them offline!</p>
        <a href="#/stories">Browse Stories</a>
      </div>
    `;
  }

  renderBookmarksList(bookmarks) {
    return `
      <div class="bookmarks-grid">
        ${bookmarks.map(story => this.renderBookmarkItem(story)).join('')}
      </div>
    `;
  }

  renderBookmarkItem(story) {
    const photoUrl = story.photoUrl || '/placeholder-image.png';
    const name = story.name || 'Untitled Story';
    const description = story.description || 'No description available';
    const createdAt = story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown date';
    const bookmarkedAt = story.bookmarkedAt ? new Date(story.bookmarkedAt).toLocaleDateString() : 'Unknown date';
    
    return `
      <div class="bookmark-item">
        <div style="position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10;">
          <button 
            class="remove-bookmark-btn" 
            data-story-id="${story.id}"
            title="Remove bookmark"
          >
            ✕ Remove
          </button>
        </div>
        
        <img 
          src="${photoUrl}" 
          alt="Story photo" 
          style="width: 100%; height: 160px; object-fit: cover;" 
          onerror="this.src='/placeholder-image.png'; this.onerror=null;"
        />
        
        <div style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; line-height: 1.3;">${name}</h4>
          <p style="margin: 0 0 1rem 0; font-size: 0.95rem; color: #666; line-height: 1.4; max-height: 3em; overflow: hidden;">${description}</p>
          
          <div style="font-size: 0.85rem; color: #999;">
            <div>Created: ${createdAt}</div>
            <div>Bookmarked: ${bookmarkedAt}</div>
          </div>
          
          ${story.lat && story.lon ? `
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
              📍 Location: ${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  setupRemoveListeners(onRemoveBookmark) {
    const removeButtons = document.querySelectorAll('.remove-bookmark-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const storyId = button.dataset.storyId;
        
        if (confirm('Are you sure you want to remove this bookmark?')) {
          try {
            button.disabled = true;
            button.textContent = 'Removing...';
            
            await onRemoveBookmark(storyId);
            
            // Remove the item from DOM
            const bookmarkItem = button.closest('.bookmark-item');
            bookmarkItem.style.opacity = '0.5';
            bookmarkItem.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
              bookmarkItem.remove();
              
              // Check if no more bookmarks
              const remaining = document.querySelectorAll('.bookmark-item');
              if (remaining.length === 0) {
                this.render([], onRemoveBookmark);
              }
            }, 300);
            
          } catch (error) {
            button.disabled = false;
            button.textContent = '✕ Remove';
            alert('Failed to remove bookmark: ' + error.message);
          }
        }
      });
    });
  }

  showError(message) {
    this.app.innerHTML = `
      <h2>Bookmarked Stories</h2>
      <div style="text-align: center; padding: 2rem; background: #f8d7da; color: #721c24; border-radius: 0.5rem; margin: 1rem 0;">
        <h3>Error Loading Bookmarks</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }

  showLoginRequired() {
    alert('You need to login first');
    location.hash = '/login';
  }
}
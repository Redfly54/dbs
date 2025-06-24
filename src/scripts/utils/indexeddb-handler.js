// src/scripts/utils/indexeddb-handler.js
export class IndexedDBHandler {
  constructor() {
    this.dbName = 'DicodingStoryDB';
    this.dbVersion = 1;
    this.storeName = 'bookmarked_stories';
    this.db = null;
  }

  // Inisialisasi database
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Hapus store lama jika ada
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }

        // Buat object store baru
        const store = db.createObjectStore(this.storeName, { 
          keyPath: 'id' 
        });
        
        // Buat index untuk pencarian berdasarkan tanggal
        store.createIndex('createdAt', 'createdAt', { unique: false });
        
        console.log('IndexedDB object store created');
      };
    });
  }

  // Menyimpan story ke bookmark
  async saveBookmark(story) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Tambahkan timestamp bookmark
      const bookmarkedStory = {
        ...story,
        bookmarkedAt: new Date().toISOString()
      };

      const request = store.add(bookmarkedStory);

      request.onsuccess = () => {
        console.log('Story bookmarked successfully:', story.id);
        resolve(bookmarkedStory);
      };

      request.onerror = () => {
        console.error('Error bookmarking story:', request.error);
        reject(request.error);
      };
    });
  }

  // Menampilkan semua bookmark
  async getAllBookmarks() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const bookmarks = request.result;
        console.log('Retrieved bookmarks:', bookmarks.length);
        resolve(bookmarks);
      };

      request.onerror = () => {
        console.error('Error getting bookmarks:', request.error);
        reject(request.error);
      };
    });
  }

  // Menghapus bookmark
  async removeBookmark(storyId) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log('Bookmark removed successfully:', storyId);
        resolve(storyId);
      };

      request.onerror = () => {
        console.error('Error removing bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  // Cek apakah story sudah di-bookmark
  async isBookmarked(storyId) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(storyId);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        console.error('Error checking bookmark:', request.error);
        reject(request.error);
      };
    });
  }

  // Menghapus semua bookmark (untuk testing)
  async clearAllBookmarks() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All bookmarks cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing bookmarks:', request.error);
        reject(request.error);
      };
    });
  }
}

export default new IndexedDBHandler();
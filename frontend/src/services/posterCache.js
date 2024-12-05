const CACHE_KEY = 'movie_posters_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const PosterCache = {
  get(movieId) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const item = cache[movieId];
      
      if (item && Date.now() - item.timestamp < CACHE_DURATION) {
        return item.posterUrl;
      }
      return null;
    } catch {
      return null;
    }
  },

  set(movieId, posterUrl) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[movieId] = {
        posterUrl,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      console.error('Error saving to poster cache');
    }
  }
}; 
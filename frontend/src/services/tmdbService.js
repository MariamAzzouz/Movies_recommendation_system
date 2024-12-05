import axios from 'axios';
import { TMDB_API_KEY, TMDB_BASE_URL } from '../config';

const tmdbService = {
  async searchMovie(title) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: title.replace(/\(\d{4}\)/, '').trim() // Remove year from title
        }
      });
      return response.data.results[0]; // Get the first match
    } catch (error) {
      console.error('Error searching TMDB:', error);
      return null;
    }
  },

  async getMovieDetails(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting movie details:', error);
      return null;
    }
  }
};

export default tmdbService;
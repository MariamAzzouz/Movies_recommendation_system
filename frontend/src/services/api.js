import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Add auth token to requests if it exists
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    async register(username, email, password) {
        const response = await axios.post(`${API_URL}/auth/register`, {
            username,
            email,
            password
        });
        return response.data;
    },

    async login(username, password) {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    }
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const movieService = {
    async getMovies(page = 1, perPage = 12) {
        try {
            const response = await axios.get(`${API_URL}/movies`, {
                params: { page, per_page: perPage }
            });
            return response;
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    },

    getRecommendations: async () => {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        return await axios.get(`${API_URL}/movies/recommendations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    },

    async searchMovies(query) {
        try {
            const response = await axios.get(`${API_URL}/movies/search`, {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.error('Search API error:', error);
            return { status: 'error', data: [] };
        }
    },

    async rateMovie(movieId, rating) {
        const response = await axios.post(`${API_URL}/movies/rate`, {
            movieId,
            rating
        });
        return response.data;
    },

    async getFeaturedMovies() {
        const response = await axios.get(`${API_URL}/movies/featured`);
        return response.data;
    },

    async addToFavorites(movieId) {
        const response = await axios.post(`${API_URL}/movies/favorite`, {
            movieId
        });
        return response.data;
    }
}; 
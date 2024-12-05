import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Container,
  Grid,
  Pagination,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import MovieCardNew from './components/MovieCardNew';
import SearchBar from './components/SearchBar';
import { movieService } from './services/api';
import './App.css';
import FilmDetails from './components/FilmDetails';

function MainContent({ searchResults = [], initialTab = 0 }) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (currentTab === 0) {
      fetchMovies(page);
    } else if (currentTab === 1) {
      fetchRecommendations();
    }
  }, [currentTab, page]);

  const fetchMovies = async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const response = await movieService.getMovies(pageNum);
      console.log('API Response:', response);
      
      if (response?.data?.status === 'success') {
        setMovies(response.data.data.movies);
        setTotalPages(response.data.data.total_pages);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    console.log('Fetching recommendations...');
    setLoading(true);
    setError(null);
    try {
      const response = await movieService.getRecommendations();
      console.log('Recommendations API Response:', response);
      if (response?.data?.status === 'success' && Array.isArray(response.data.data)) {
        setRecommendations(response.data.data);
      } else {
        console.warn('No recommendations found or invalid format.', response.data);
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchResults?.length > 0) {
      setCurrentTab(3);
    }
  }, [searchResults]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchMovies(1),
        fetchRecommendations()
      ]);
    } catch (err) {
      setError('Failed to fetch initial data. Please try again later.');
      console.error('Error fetching initial data:', err);
    }
  };

  const handleRating = async (movieId, rating) => {
    try {
      await movieService.rateMovie(movieId, rating);
      fetchRecommendations();
    } catch (err) {
      console.error('Error rating movie:', err);
    }
  };

  const handleFavorite = async (movieId) => {
    try {
      await movieService.addToFavorites(movieId);
      fetchRecommendations();
    } catch (err) {
      console.error('Error adding to favorites:', err);
    }
  };
  const getCurrentContent = () => {
    switch (currentTab) {
      case 0:
        return movies;
      case 1:
        return recommendations;
      case 2:
        return movies.filter(movie => favorites.includes(movie.id));
      case 3:
        return searchResults;
      default:
        return [];
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => {
          setCurrentTab(newValue);
          setPage(1); // Reset page when changing tabs
        }}
        centered
        sx={{ mb: 4 }}
      >
        <Tab label="All Movies" />
        <Tab label="Recommendations" />
        <Tab label="Favorites" />
        {searchResults.length > 0 && <Tab label="Search Results" />}
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {getCurrentContent().map((movie) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCardNew
                  movie={movie}
                  onRate={handleRating}
                  onFavorite={handleFavorite}
                  isFavorite={favorites.includes(movie.id)}
                />
              </Grid>
            ))}
          </Grid>

          {!loading && getCurrentContent().length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                {currentTab === 2 
                  ? "No favorite movies yet. Start adding some!" 
                  : "No movies found."}
              </Typography>
            </Box>
          )}

          {totalPages > 1 && currentTab === 0 && (
            <Box 
              display="flex" 
              justifyContent="center"
              sx={{ mt: 4, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

function App() {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (results) => {
    // Ensure unique search results by filtering duplicates based on movie ID
    const uniqueResults = results.reduce((acc, current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    setSearchResults(uniqueResults);
  };

  return (
    <Router>
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Navbar>
          <SearchBar onSearchResults={handleSearch} />
        </Navbar>
        <Routes>
          <Route path="/" element={<MainContent searchResults={searchResults} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movies" element={<MainContent searchResults={searchResults} />} />
          <Route path="/movies/:id" element={<FilmDetails />} />
          <Route path="/recommendations" element={<MainContent initialTab={1} searchResults={searchResults} />} />
          <Route path="/favorites" element={<MainContent initialTab={2} searchResults={searchResults} />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import MovieCardNew from './MovieCardNew';
import SearchBar from './SearchBar';
import { Box, Container, Typography, CircularProgress } from '@mui/material';

const MainContent = () => {
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        // Fetch recommendations if user is logged in
        if (token) {
          const recResponse = await fetch('http://localhost:5000/movies/recommendations', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!recResponse.ok) {
            throw new Error('Failed to fetch recommendations');
          }
          
          const recData = await recResponse.json();
          if (recData.status === 'success' && Array.isArray(recData.data)) {
            setRecommendations(recData.data);
          } else {
            setRecommendations([]);
          }
        }
        
        // Fetch featured movies
        const moviesResponse = await fetch('http://localhost:5000/movies/featured');
        if (!moviesResponse.ok) {
          throw new Error('Failed to fetch featured movies');
        }
        
        const moviesData = await moviesResponse.json();
        if (moviesData.status === 'success' && Array.isArray(moviesData.data)) {
          setMovies(moviesData.data);
        } else {
          setMovies([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setMovies([]);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/movies/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRateMovie = async (movieId, rating) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/movies/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ movieId, rating })
      });
      if (!response.ok) throw new Error('Failed to rate movie');
    } catch (error) {
      console.error('Error rating movie:', error);
    }
  };

  const handleFavoriteMovie = async (movieId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/movies/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ movieId })
      });
      if (!response.ok) throw new Error('Failed to favorite movie');
      
      setFavorites(prev => 
        prev.includes(movieId) 
          ? prev.filter(id => id !== movieId)
          : [...prev, movieId]
      );
    } catch (error) {
      console.error('Error favoriting movie:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <SearchBar onSearch={handleSearch} />
        
        {searchResults.length > 0 ? (
          <section>
            <Typography variant="h4" sx={{ mb: 3 }}>Search Results</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 3
              }}
            >
              {searchResults.map((movie) => (
                <MovieCardNew
                  key={movie.id}
                  movie={movie}
                  onRate={handleRateMovie}
                  onFavorite={handleFavoriteMovie}
                  isFavorite={favorites.includes(movie.id)}
                />
              ))}
            </Box>
          </section>
        ) : (
          <>
            {recommendations.length > 0 && (
              <section>
                <Typography variant="h4" sx={{ mb: 3 }}>Recommended for You</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 3,
                    mb: 6
                  }}
                >
                  {recommendations.map((movie) => (
                    <MovieCardNew
                      key={movie.id}
                      movie={movie}
                      onRate={handleRateMovie}
                      onFavorite={handleFavoriteMovie}
                      isFavorite={favorites.includes(movie.id)}
                    />
                  ))}
                </Box>
              </section>
            )}

            <section>
              <Typography variant="h4" sx={{ mb: 3 }}>Featured Movies</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 3
                }}
              >
                {movies.map((movie) => (
                  <MovieCardNew
                    key={movie.id}
                    movie={movie}
                    onRate={handleRateMovie}
                    onFavorite={handleFavoriteMovie}
                    isFavorite={favorites.includes(movie.id)}
                  />
                ))}
              </Box>
            </section>
          </>
        )}
      </Box>
    </Container>
  );
};

export default MainContent;

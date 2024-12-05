import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Typography, Box, CircularProgress } from '@mui/material';

const FilmDetails = () => {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFilmDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/movies/${id}/details`);
        console.log('Film details response:', response.data);
        setFilm(response.data.details);
      } catch (err) {
        setError('Failed to fetch film details');
      } finally {
        setLoading(false);
      }
    };

    fetchFilmDetails();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">{film.title}</Typography>
      <Typography variant="body1">{film.overview}</Typography>
      <Typography variant="h6">Release Date: {film.release_date}</Typography>
      <Typography variant="h6">Rating: {film.vote_average}</Typography>
      <img src={film.poster_path} alt={film.title} style={{ width: '100%' }} />
      <Box>
        {film.videos.map(video => (
          <Box key={video.id} sx={{ marginBottom: 2 }}>
            <Typography variant="body2">{video.name}</Typography>
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${video.key}`}
              title={video.name}
              frameBorder="0"
              allowFullScreen
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default FilmDetails; 
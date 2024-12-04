import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Rating,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PeopleIcon from '@mui/icons-material/People';

const MovieCard = ({ movie, onRate, onFavorite, isFavorite }) => {
  if (!movie) return null;

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const { title, genres, rating, ratingCount, year, posterUrl } = movie;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6
        }
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '150%' }}>
        {imageLoading && (
          <Skeleton 
            variant="rectangular" 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }} 
          />
        )}
        <CardMedia
          component="img"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: imageLoading ? 'none' : 'block'
          }}
          image={
            imageError
              ? `https://via.placeholder.com/500x750?text=${encodeURIComponent(title)}`
              : posterUrl
          }
          alt={title}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {title.replace(/ \(\d{4}\)$/, '')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {year}
          </Typography>
        </Box>

        <Box mb={2} sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {genres.map((genre) => (
            <Chip
              key={genre}
              label={genre}
              size="small"
              sx={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: '#bbdefb'
                }
              }}
            />
          ))}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Rating
              value={rating}
              precision={0.5}
              readOnly
              size="small"
            />
            <Tooltip title={`${ratingCount} ratings`}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {ratingCount.toLocaleString()}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Rating
              name={`user-rating-${movie.id}`}
              onChange={(event, newValue) => onRate(movie.id, newValue)}
              size="large"
            />
            <IconButton
              onClick={() => onFavorite(movie.id)}
              color={isFavorite ? "error" : "default"}
              size="small"
            >
              <FavoriteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MovieCard; 
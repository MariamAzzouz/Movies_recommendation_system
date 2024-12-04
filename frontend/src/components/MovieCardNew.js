import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Rating,
  Box,
  IconButton,
  Skeleton
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const MovieCardNew = ({ movie, onRate, onFavorite, isFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {imageLoading && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={400} 
          animation="wave" 
        />
      )}
      <CardMedia
        component="img"
        height={400}
        image={imageError ? 
          "https://via.placeholder.com/500x750?text=No+Poster" : 
          movie.posterUrl
        }
        alt={movie.title}
        onError={handleImageError}
        onLoad={handleImageLoad}
        sx={{
          objectFit: 'cover',
          display: imageLoading ? 'none' : 'block'
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {movie.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {movie.year}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Rating
            name={`rating-${movie.id}`}
            value={movie.rating}
            precision={0.5}
            onChange={(event, newValue) => onRate?.(movie.id, newValue)}
            size="small"
          />
          <Typography variant="body2" color="text.secondary" ml={1}>
            ({movie.ratingCount?.toLocaleString() || 0})
          </Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
          {movie.genres.map((genre, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                bgcolor: 'action.selected',
                padding: '2px 6px',
                borderRadius: 1
              }}
            >
              {genre}
            </Typography>
          ))}
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <IconButton
            onClick={() => onFavorite?.(movie.id)}
            color={isFavorite ? "error" : "default"}
            size="small"
          >
            <FavoriteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MovieCardNew; 
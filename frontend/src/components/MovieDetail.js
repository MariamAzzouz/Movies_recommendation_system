import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    Rating,
    Button,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const MovieDetail = ({ movie, open, onClose, onRate }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {movie?.title}
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Box
                            component="img"
                            src={movie?.poster_path || '/placeholder.jpg'}
                            alt={movie?.title}
                            sx={{ width: '100%', borderRadius: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="body1" paragraph>
                            {movie?.overview}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            Release Date: {movie?.release_date}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            Genres: {movie?.genres}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Your Rating:
                            </Typography>
                            <Rating
                                size="large"
                                onChange={(event, newValue) => {
                                    onRate(movie.movieId, newValue);
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default MovieDetail; 
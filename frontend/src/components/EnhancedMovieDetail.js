import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    Rating,
    Button,
    Box,
    IconButton,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import { Close, PlayArrow, Add, ThumbUp } from '@mui/icons-material';

const EnhancedMovieDetail = ({ movie, open, onClose, onRate }) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#141414',
                    color: 'white'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">{movie?.title}</Typography>
                    <IconButton onClick={onClose} color="inherit">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: '400px',
                                backgroundImage: `url(${movie?.poster_path})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 2,
                                mb: 3
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    p: 2,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<PlayArrow />}
                                        size="large"
                                    >
                                        Play
                                    </Button>
                                    <IconButton color="inherit">
                                        <Add />
                                    </IconButton>
                                    <IconButton color="inherit">
                                        <ThumbUp />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            sx={{ mb: 2 }}
                        >
                            <Tab label="Overview" />
                            <Tab label="Details" />
                            <Tab label="Similar" />
                        </Tabs>
                        
                        {activeTab === 0 && (
                            <Box>
                                <Typography variant="body1" paragraph>
                                    {movie?.overview}
                                </Typography>
                                <Typography variant="subtitle1" gutterBottom>
                                    Your Rating:
                                </Typography>
                                <Rating
                                    size="large"
                                    value={movie?.userRating || 0}
                                    onChange={(_, value) => onRate(movie?.movieId, value)}
                                />
                            </Box>
                        )}
                        
                        {activeTab === 1 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Release Date: {movie?.release_date}
                                </Typography>
                                <Typography variant="subtitle1" gutterBottom>
                                    Genres:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {movie?.genres.split('|').map((genre) => (
                                        <Chip
                                            key={genre}
                                            label={genre}
                                            sx={{ bgcolor: 'primary.main' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                        
                        {activeTab === 2 && (
                            <Box>
                                <Typography variant="body1">
                                    Similar movies will be displayed here...
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default EnhancedMovieDetail; 
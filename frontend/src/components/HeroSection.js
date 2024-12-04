import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const HeroSection = ({ movie, onPlay }) => {
    if (!movie) return null;

    return (
        <Box
            sx={{
                height: '80vh',
                width: '100%',
                position: 'relative',
                background: `linear-gradient(to bottom, rgba(20,20,20,0) 0%, rgba(20,20,20,1) 100%), 
                            url(${movie.poster_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '35%',
                    left: '5%',
                    maxWidth: '40%'
                }}
            >
                <Typography variant="h2" gutterBottom>
                    {movie.title}
                </Typography>
                <Typography variant="body1" paragraph>
                    {movie.overview}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        onClick={onPlay}
                        sx={{ 
                            bgcolor: 'white', 
                            color: 'black',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.75)'
                            }
                        }}
                    >
                        Play
                    </Button>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<InfoOutlinedIcon />}
                        sx={{ 
                            bgcolor: 'rgba(109, 109, 110, 0.7)',
                            '&:hover': {
                                bgcolor: 'rgba(109, 109, 110, 0.4)'
                            }
                        }}
                    >
                        More Info
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default HeroSection; 
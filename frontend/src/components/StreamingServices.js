import React from 'react';
import { Box, Avatar } from '@mui/material';

const StreamingServices = () => {
    const services = [
        { id: 'netflix', logo: '/netflix-logo.png' },
        { id: 'prime', logo: '/prime-logo.png' },
        { id: 'disney', logo: '/disney-logo.png' },
        // Add more streaming services
    ];

    return (
        <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
            {services.map(service => (
                <Avatar
                    key={service.id}
                    src={service.logo}
                    sx={{ width: 40, height: 40 }}
                />
            ))}
        </Box>
    );
};

export default StreamingServices; 
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, progress }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        zIndex: 9999,
      }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        value={progress}
        variant={progress ? "determinate" : "indeterminate"}
      />
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2,
          color: 'text.primary'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 
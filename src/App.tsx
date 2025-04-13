import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RequestPanel from './components/RequestPanel';
import ResponsePanel from './components/ResponsePanel';
import SettingsPanel from './components/SettingsPanel';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import LoadingScreen from './components/LoadingScreen';
import apiService from './services/api';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing application...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleResponse = (response: any) => {
    setResponse(response);
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Checking API availability...');
      setLoadingProgress(20);

      // Wait for API to be ready with a timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('API initialization timeout'));
        }, 10000); // 10 second timeout

        const checkApi = () => {
          if (window.api) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkApi, 100); // Check every 100ms
          }
        };

        checkApi();
      });

      setLoadingMessage('Loading settings...');
      setLoadingProgress(40);

      // Initialize API service
      await apiService.initialize();

      setLoadingMessage('Preparing application...');
      setLoadingProgress(80);

      // Add a small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      setLoadingProgress(100);
      setInitialized(true);
    } catch (error) {
      console.error('Initialization error:', error);
      // Don't set error state, just log it
      setInitialized(true); // Still allow the app to render
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle Chrome extension errors
    window.addEventListener('error', (event) => {
      if (event.message?.includes('chrome-extension://')) {
        console.log('Ignoring Chrome extension error:', event.message);
        event.preventDefault();
      }
    });

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LoadingScreen 
          message={loadingMessage} 
          progress={loadingProgress} 
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar 
          selectedEndpoint={selectedEndpoint}
          onEndpointSelect={setSelectedEndpoint}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Box sx={{ 
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              p: 2,
              flexGrow: 1,
              overflow: 'hidden'
            }}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <>
                      <RequestPanel 
                        endpoint={selectedEndpoint} 
                        onResponse={handleResponse}
                      />
                      <ResponsePanel response={response} />
                    </>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={<SettingsPanel onSave={() => setIsSettingsOpen(false)} />} 
                />
              </Routes>
            </Box>
            
            {/* Navigation Buttons */}
            <Box sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              zIndex: 1200,
              display: 'flex',
              gap: 1,
            }}>
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                  }
                }}
              >
                <HomeIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate('/settings')}
                sx={{
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                  }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 
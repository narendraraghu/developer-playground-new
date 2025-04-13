import { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import apiService from '../services/api';

interface RequestPanelProps {
  endpoint: string;
  onResponse: (response: any) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number | string;
  value: number | string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RequestPanel = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://sandbox.api.visa.com/vdp/helloworld');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('body');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [isApiReady, setIsApiReady] = useState(false);
  const [hasCertificates, setHasCertificates] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const result = await window.api.loadSettings();
        if (result.success && result.settings) {
          setSettings(result.settings);
          const { publicKey, privateKey } = result.settings;
          setHasCertificates(!!publicKey && !!privateKey);
          console.log('Current settings:', result.settings);
          console.log('Has certificates:', !!publicKey && !!privateKey);
        }
        setIsApiReady(true);
      } catch (error) {
        console.error('Error checking API:', error);
        setIsApiReady(true); // Still set API as ready even if there's an error
      }
    };

    const handleCertificatesUpdated = (event: CustomEvent) => {
      const { publicKey, privateKey } = event.detail;
      setHasCertificates(!!publicKey && !!privateKey);
      console.log('Certificates updated:', { publicKey, privateKey });
    };

    // Initial check
    checkApi();

    // Listen for certificate updates
    window.addEventListener('certificates-updated', handleCertificatesUpdated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('certificates-updated', handleCertificatesUpdated as EventListener);
    };
  }, []);

  const handleSend = async () => {
    if (!isApiReady) {
      setError('API is not ready yet. Please wait...');
      return;
    }

    // Reload settings to ensure we have the latest
    try {
      const result = await window.api.loadSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        const { publicKey, privateKey } = result.settings;
        setHasCertificates(!!publicKey && !!privateKey);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    if (!hasCertificates) {
      setError('SSL certificates are required. Please upload them in the Settings panel.');
      return;
    }

    if (!settings?.userId || !settings?.password) {
      setError('User ID and Password are required. Please configure them in the Settings panel.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Add basic authentication header
      const auth = Buffer.from(`${settings.userId}:${settings.password}`).toString('base64');
      const requestHeaders = {
        ...headers,
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const result = await window.api.request(method, url, requestBody ? JSON.parse(requestBody) : undefined, requestHeaders);
      if (result.success) {
        setResponse(result);
      } else {
        setError(result.error || 'Request failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Request
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Method</InputLabel>
            <Select
              value={method}
              label="Method"
              onChange={(e) => setMethod(e.target.value)}
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={!!error && error.includes('url')}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={loading}
          >
            Send
          </Button>
        </Box>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Headers" value="headers" />
          <Tab label="Body" value="body" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <TextField
          fullWidth
          multiline
          rows={10}
          placeholder="Enter headers in JSON format"
          value={JSON.stringify(headers, null, 2)}
          onChange={(e) => {
            try {
              setHeaders(JSON.parse(e.target.value));
            } catch (error) {
              console.error('Invalid JSON format:', error);
            }
          }}
          error={!!error && error.includes('headers')}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <TextField
          fullWidth
          multiline
          rows={10}
          placeholder="Enter request body in JSON format"
          value={requestBody}
          onChange={(e) => setRequestBody(e.target.value)}
          error={!!error && error.includes('body')}
        />
      </TabPanel>
    </Paper>
  );
};

export default RequestPanel; 
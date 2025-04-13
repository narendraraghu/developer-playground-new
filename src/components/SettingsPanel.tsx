import { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, Upload as UploadIcon } from '@mui/icons-material';

declare global {
  interface Window {
    api: {
      saveCertificate: (type: string, fileContent: ArrayBuffer) => Promise<{ success: boolean; path?: string; error?: string }>;
      saveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
      loadSettings: () => Promise<{ success: boolean; settings?: any; error?: string }>;
      request: (method: string, url: string, data?: any, headers?: any) => Promise<{ success: boolean; data?: any; headers?: any; error?: string }>;
    };
  }
}

interface Settings {
  authMethod: 'mutualSSL' | 'xPayToken';
  userId: string;
  password: string;
  publicKey: string;
  privateKey: string;
  keyStore: 'JKS' | 'PKCS12';
  host: string;
  port: string;
  mleEnabled: boolean;
  mleKeyId: string;
  mlePublicKey: string;
  mlePrivateKey: string;
}

interface FileUploadState {
  sslPublicKey: string;
  sslPrivateKey: string;
  mlePublicKey: string;
  mlePrivateKey: string;
}

interface SettingsPanelProps {
  onSave?: (settings: Settings) => void;
}

const SettingsPanel = ({ onSave }: SettingsPanelProps) => {
  const [settings, setSettings] = useState<Settings>({
    authMethod: 'mutualSSL',
    userId: '',
    password: '',
    publicKey: '',
    privateKey: '',
    keyStore: 'JKS',
    host: '',
    port: '',
    mleEnabled: false,
    mleKeyId: '',
    mlePublicKey: '',
    mlePrivateKey: '',
  });

  const [fileNames, setFileNames] = useState<FileUploadState>({
    sslPublicKey: '',
    sslPrivateKey: '',
    mlePublicKey: '',
    mlePrivateKey: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 10;

  const fileInputRefs = {
    sslPublicKey: useRef<HTMLInputElement>(null),
    sslPrivateKey: useRef<HTMLInputElement>(null),
    mlePublicKey: useRef<HTMLInputElement>(null),
    mlePrivateKey: useRef<HTMLInputElement>(null),
  };

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await window.api.loadSettings();
        if (result.success && result.settings) {
          console.log('Loaded settings:', result.settings);
          setSettings(result.settings);
          setFileNames({
            sslPublicKey: result.settings.publicKey ? 'Certificate loaded' : '',
            sslPrivateKey: result.settings.privateKey ? 'Private key loaded' : '',
            mlePublicKey: result.settings.mlePublicKey ? 'MLE public key loaded' : '',
            mlePrivateKey: result.settings.mlePrivateKey ? 'MLE private key loaded' : '',
          });

          // Dispatch event to notify other components about current settings
          window.dispatchEvent(new CustomEvent('certificates-updated', {
            detail: {
              publicKey: result.settings.publicKey,
              privateKey: result.settings.privateKey
            }
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    const checkApi = () => {
      if (window.api) {
        setIsApiReady(true);
        loadSettings();
      } else if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        setTimeout(checkApi, 500);
      }
    };

    checkApi();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (isApiReady && settings) {
      const saveSettings = async () => {
        try {
          const result = await window.api.saveSettings(settings);
          if (!result.success) {
            console.error('Failed to save settings:', result.error);
          } else {
            // Dispatch event to notify other components about settings update
            window.dispatchEvent(new CustomEvent('certificates-updated', {
              detail: {
                publicKey: settings.publicKey,
                privateKey: settings.privateKey
              }
            }));
          }
        } catch (error) {
          console.error('Error saving settings:', error);
        }
      };

      saveSettings();
    }
  }, [settings, isApiReady]);

  const handleChange = (field: keyof Settings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.target.value,
    });
  };

  const handleFileUpload = (type: keyof FileUploadState) => {
    const input = fileInputRefs[type];
    if (input.current) {
      input.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'public' | 'private') => {
    if (!window.api) {
      console.error('API is not available');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.arrayBuffer();
      const result = await window.api.saveCertificate(type, fileContent);
      if (result.success) {
        const settings = await window.api.loadSettings();
        if (settings.success && settings.settings) {
          setSettings(settings.settings);
          // Emit event to notify other components
          window.dispatchEvent(new CustomEvent('certificates-updated', {
            detail: {
              publicKey: settings.settings.publicKey,
              privateKey: settings.settings.privateKey
            }
          }));
        }
      } else {
        console.error('Failed to save certificate:', result.error);
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
    }
  };

  const handleSave = async () => {
    if (!isApiReady) {
      setSnackbar({
        open: true,
        message: 'API is not ready yet. Please wait...',
        severity: 'error',
      });
      return;
    }

    try {
      const result = await window.api.saveSettings(settings);
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Settings saved successfully',
          severity: 'success',
        });
        if (onSave) {
          onSave(settings);
        }
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error saving settings',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save Settings
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Authentication Method</FormLabel>
            <RadioGroup
              row
              value={settings.authMethod}
              onChange={handleChange('authMethod')}
            >
              <FormControlLabel
                value="mutualSSL"
                control={<Radio />}
                label="Mutual SSL"
              />
              <FormControlLabel
                value="xPayToken"
                control={<Radio />}
                label="X-Pay-Token"
              />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="User ID"
            value={settings.userId}
            onChange={handleChange('userId')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={settings.password}
            onChange={handleChange('password')}
          />
        </Grid>

        {settings.authMethod === 'mutualSSL' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Mutual SSL Certificates
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Public Key Certificate"
                value={fileNames.sslPublicKey}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={(event) => handleFileUpload('sslPublicKey')}>
                        <UploadIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <input
                type="file"
                ref={fileInputRefs.sslPublicKey}
                style={{ display: 'none' }}
                accept=".pem,.crt,.cer"
                onChange={(event) => handleFileChange(event, 'public')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Private Key"
                value={fileNames.sslPrivateKey}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={(event) => handleFileUpload('sslPrivateKey')}>
                        <UploadIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <input
                type="file"
                ref={fileInputRefs.sslPrivateKey}
                style={{ display: 'none' }}
                accept=".key,.pem"
                onChange={(event) => handleFileChange(event, 'private')}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Key Store</FormLabel>
                <RadioGroup
                  row
                  value={settings.keyStore}
                  onChange={handleChange('keyStore')}
                >
                  <FormControlLabel
                    value="JKS"
                    control={<Radio />}
                    label="JKS"
                  />
                  <FormControlLabel
                    value="PKCS12"
                    control={<Radio />}
                    label="PKCS12"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Proxy Settings
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Host"
            value={settings.host}
            onChange={handleChange('host')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Port"
            value={settings.port}
            onChange={handleChange('port')}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Message Level Encryption
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="MLE Key ID"
            value={settings.mleKeyId}
            onChange={handleChange('mleKeyId')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="MLE Public Key"
            value={fileNames.mlePublicKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={(event) => handleFileUpload('mlePublicKey')}>
                    <UploadIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <input
            type="file"
            ref={fileInputRefs.mlePublicKey}
            style={{ display: 'none' }}
            accept=".pem,.crt,.cer"
            onChange={(event) => handleFileChange(event, 'public')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="MLE Private Key"
            value={fileNames.mlePrivateKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={(event) => handleFileUpload('mlePrivateKey')}>
                    <UploadIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <input
            type="file"
            ref={fileInputRefs.mlePrivateKey}
            style={{ display: 'none' }}
            accept=".key,.pem"
            onChange={(event) => handleFileChange(event, 'private')}
          />
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SettingsPanel; 
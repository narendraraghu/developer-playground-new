const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const Store = require('electron-store');
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV === 'development';

// Create a store for settings
const store = new Store({
  defaults: {
    settings: {
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
    }
  },
  name: 'visa-direct-settings',
  fileExtension: 'json',
  clearInvalidConfig: true,
  serialize: (value) => JSON.stringify(value),
  deserialize: (value) => JSON.parse(value)
});

// Create a directory for certificates
const certificatesDir = path.join(app.getPath('userData'), 'certificates');

async function ensureCertificatesDirectory() {
  try {
    await fs.mkdir(certificatesDir, { recursive: true });
    console.log('Certificates directory created at:', certificatesDir);
  } catch (error) {
    console.error('Error creating certificates directory:', error);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false // Don't show the window until it's ready
  });

  // Handle Chrome extension errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorDescription.includes('chrome-extension://')) {
      console.log('Ignoring Chrome extension error:', errorDescription);
      return;
    }
    console.error('Failed to load:', errorDescription);
  });

  // Load the preload script
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, preload script should be active');
    // Verify that the preload script is loaded
    mainWindow.webContents.executeJavaScript('window.api ? "API ready" : "API not ready"')
      .then(result => {
        console.log('Preload script status:', result);
        if (result === 'API ready') {
          mainWindow.show(); // Show the window only when API is ready
        }
      })
      .catch(error => console.error('Error checking preload script:', error));
  });

  if (isDev) {
    // In development, load from the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

// Create window when app is ready
app.whenReady().then(async () => {
  await ensureCertificatesDirectory();
  const mainWindow = createWindow();

  // Handle window activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler for saving settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    console.log('Saving settings:', settings);
    // Ensure we're saving a complete settings object
    const currentSettings = store.get('settings') || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    store.set('settings', updatedSettings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for loading settings
ipcMain.handle('load-settings', async () => {
  try {
    const settings = store.get('settings');
    console.log('Loading settings:', settings);
    return { success: true, settings };
  } catch (error) {
    console.error('Error loading settings:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for certificate operations
ipcMain.handle('save-certificate', async (event, { type, fileContent }) => {
  try {
    // Generate a unique filename
    const fileName = `${type}_${Date.now()}.pem`;
    const targetPath = path.join(certificatesDir, fileName);
    
    // Convert ArrayBuffer to Buffer and save the file
    const buffer = Buffer.from(fileContent);
    await fs.writeFile(targetPath, buffer);
    
    // Update settings with the new certificate path
    const settings = store.get('settings') || {};
    settings[type] = targetPath;
    store.set('settings', settings);
    
    return {
      success: true,
      path: targetPath,
    };
  } catch (error) {
    console.error('Error saving certificate:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// IPC handler for API requests
ipcMain.handle('api-request', async (event, { method, url, headers, data, settings }) => {
  console.log('\n=== API Request Debug Log ===');
  console.log('Request Configuration:');
  console.log('Method:', method);
  console.log('URL:', url);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Settings:', JSON.stringify(settings, null, 2));

  try {
    if (!settings) {
      console.error('No settings provided');
      return { success: false, error: 'No settings provided' };
    }

    if (!settings.publicKey || !settings.privateKey) {
      console.error('SSL certificates not configured');
      return { success: false, error: 'SSL certificates not configured' };
    }

    console.log('\nReading SSL certificates...');
    const publicKey = await fs.readFile(settings.publicKey);
    const privateKey = await fs.readFile(settings.privateKey);
    console.log('SSL certificates read successfully');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: true,
      cert: publicKey,
      key: privateKey
    });

    console.log('\nCreating request configuration...');
    const config = {
      method,
      url,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${settings.userId}:${settings.password}`).toString('base64')}`,
        'X-Correlation-ID': crypto.randomUUID()
      },
      data,
      httpsAgent,
      validateStatus: (status: number) => status < 500
    };
    console.log('Request configuration created:', JSON.stringify(config, null, 2));

    console.log('\nMaking API request...');
    const response = await axios(config);
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    return {
      success: true,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    console.error('\nAPI Request Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      return {
        success: false,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});
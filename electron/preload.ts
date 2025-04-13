const { contextBridge, ipcRenderer } = require('electron');

// Create a promise that resolves when the API is ready
const apiReady = new Promise<void>((resolve) => {
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'api', {
      saveCertificate: (type: string, fileContent: ArrayBuffer) => {
        return ipcRenderer.invoke('save-certificate', { type, fileContent });
      },
      saveSettings: (settings: any) => {
        return ipcRenderer.invoke('save-settings', settings);
      },
      loadSettings: () => {
        return ipcRenderer.invoke('load-settings');
      },
      request: async (config: {
        method: string;
        url: string;
        data?: any;
        headers?: any;
        settings?: any;
      }) => {
        console.log('Preload: Making request with config:', config);
        return ipcRenderer.invoke('api-request', config);
      }
    }
  );
  resolve();
});

// Log when the preload script is loaded and API is exposed
console.log('Preload script loaded');

// Wait for the API to be exposed before dispatching the ready event
apiReady.then(() => {
  console.log('API exposed to window');
  // Ensure the window object is available
  if (window) {
    window.dispatchEvent(new Event('api-ready'));
  }
});

// Add error handling for IPC messages
ipcRenderer.on('error', (event, error) => {
  console.error('IPC Error:', error);
}); 
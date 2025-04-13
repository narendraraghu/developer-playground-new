import axios from 'axios';

declare global {
  interface Window {
    api: {
      saveCertificate: (type: string, fileContent: ArrayBuffer) => Promise<{ success: boolean; path?: string; error?: string }>;
      saveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
      loadSettings: () => Promise<{ success: boolean; settings?: any; error?: string }>;
      request: (config: {
        method: string;
        url: string;
        data?: any;
        headers?: any;
        settings?: any;
      }) => Promise<APIResponse>;
    };
  }
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  headers?: any;
  status?: number;
  response?: any;
}

class APIService {
  private static instance: APIService;
  private isInitialized = false;
  private baseUrl = 'https://sandbox.api.visa.com/';
  private headers: Record<string, string> = {};

  private constructor() {}

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private async waitForApi(): Promise<void> {
    if (window.api) return;

    return new Promise((resolve) => {
      const checkApi = () => {
        if (window.api) {
          resolve();
        } else {
          setTimeout(checkApi, 100);
        }
      };
      checkApi();
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.waitForApi();
      const settings = await this.loadSettings();
      
      if (settings.success && settings.settings) {
        this.baseUrl = settings.settings.host || this.baseUrl;
        this.headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  private async loadSettings(): Promise<{ success: boolean; settings?: any; error?: string }> {
    if (!window.api) {
      throw new Error('API is not available');
    }
    return window.api.loadSettings();
  }

  async request(method: string, url: string, data?: any, headers?: any): Promise<APIResponse> {
    console.log('\n=== API Service Debug Log ===');
    console.log('Making request:', { method, url, data, headers });

    try {
      if (!window.api) {
        console.error('API is not available');
        throw new Error('API is not available');
      }

      const settings = await this.loadSettings();
      console.log('Loaded settings:', settings);

      if (!settings.success || !settings.settings) {
        console.error('Failed to load settings:', settings.error);
        throw new Error('Failed to load settings');
      }

      // Check if SSL certificates are configured
      if (!settings.settings.publicKey || !settings.settings.privateKey) {
        console.error('SSL certificates not configured');
        throw new Error('SSL certificates are required. Please upload them in the Settings panel.');
      }

      console.log('Sending request to main process...');
      const response = await window.api.request({
        method,
        url,
        data,
        headers: {
          ...headers,
          ...this.headers
        },
        settings: settings.settings
      });

      console.log('Received response:', response);
      return response;
    } catch (error) {
      console.error('API Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create and export a single instance
const apiService = APIService.getInstance();
export default apiService; 
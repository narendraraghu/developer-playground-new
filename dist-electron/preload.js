"use strict";
const { contextBridge, ipcRenderer } = require("electron");
const apiReady = new Promise((resolve) => {
  contextBridge.exposeInMainWorld(
    "api",
    {
      saveCertificate: (type, fileContent) => {
        return ipcRenderer.invoke("save-certificate", { type, fileContent });
      },
      saveSettings: (settings) => {
        return ipcRenderer.invoke("save-settings", settings);
      },
      loadSettings: () => {
        return ipcRenderer.invoke("load-settings");
      },
      request: async (config) => {
        console.log("Preload: Making request with config:", config);
        return ipcRenderer.invoke("api-request", config);
      }
    }
  );
  resolve();
});
console.log("Preload script loaded");
apiReady.then(() => {
  console.log("API exposed to window");
  if (window) {
    window.dispatchEvent(new Event("api-ready"));
  }
});
ipcRenderer.on("error", (event, error) => {
  console.error("IPC Error:", error);
});

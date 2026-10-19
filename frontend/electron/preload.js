const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bkdDesktop', Object.freeze({ platform: process.platform, appName: 'General Hospital BKD Pharmacy', discoverApi: () => ipcRenderer.invoke('bkd:discover-api') }));

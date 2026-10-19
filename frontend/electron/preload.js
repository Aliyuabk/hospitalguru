const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('bkdDesktop', Object.freeze({ platform: process.platform, appName: 'General Hospital BKD Pharmacy' }));

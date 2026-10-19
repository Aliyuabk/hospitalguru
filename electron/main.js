const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const isDev = !app.isPackaged;
let windowRef;
let server;
function createWindow() {
  windowRef = new BrowserWindow({
    width: 1440, height: 940, minWidth: 1024, minHeight: 720,
    title: 'General Hospital BKD Pharmacy',
    backgroundColor: '#f6f8f7',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  windowRef.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  windowRef.loadURL(isDev ? (process.env.BKD_FRONTEND_URL || 'http://localhost:3000') : 'http://localhost:3000');
}
app.whenReady().then(() => { if (app.isPackaged) { const serverPath = path.join(process.resourcesPath, 'app', 'server.js'); server = spawn(process.execPath, [serverPath], { cwd: path.dirname(serverPath), env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: '3000', HOSTNAME: '127.0.0.1' }, stdio: 'ignore', windowsHide: true }); } createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('before-quit', () => { if (server) server.kill(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

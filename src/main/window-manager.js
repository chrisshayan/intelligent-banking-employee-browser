const { app, BrowserWindow } = require('electron');
const path = require('path');
const config = require('../utils/config');

let mainWindow = null;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window with security-hardened settings
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false, // Security: Disable Node.js in renderer
      contextIsolation: true, // Security: Isolate context
      sandbox: true, // Security: Enable sandbox
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: true, // Security: Enable web security
      allowRunningInsecureContent: false, // Security: Block insecure content
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png')
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    mainWindow.focus();
  });

  // Load initial URL (can be configured)
  let startUrl = process.env.START_URL || config.get('app.startUrl') || 'https://app.backbase.com';
  
  // Handle file:// URLs in development
  if (startUrl.startsWith('file://') && !startUrl.startsWith('file:///')) {
    startUrl = 'file://' + path.resolve(__dirname, '../../', startUrl.replace('file://', ''));
  }
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log navigation events
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('Navigated to:', url);
  });

  // Log navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Navigation failed:', errorCode, errorDescription);
  });

  return mainWindow;
}

/**
 * Get the main window instance
 */
function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createWindow,
  getMainWindow
};


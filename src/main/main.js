const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createWindow } = require('./window-manager');
const { initializeSecurity } = require('./security/security-manager');
const { initializeSessionManager } = require('./session/session-manager');
const { startAPIServer, stopAPIServer } = require('./api-server');
const config = require('../utils/config');

// Handle app lifecycle
app.whenReady().then(() => {
  // Initialize security policies
  initializeSecurity();

  // Initialize session management
  initializeSessionManager();

  // Start API server
  startAPIServer();

  // Create main window
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopAPIServer();
    app.quit();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  stopAPIServer();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.warn('Blocked new window creation to:', navigationUrl);
  });
});

// Log app startup
console.log('Backbase Secure Runtime starting...');
console.log('Version:', app.getVersion());
console.log('Platform:', process.platform);


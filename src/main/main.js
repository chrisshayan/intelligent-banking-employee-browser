const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createWindow } = require('./window-manager');
const { initializeSecurity } = require('./security/security-manager');
const { initializeSessionManager } = require('./session/session-manager');
const { startAPIServer, stopAPIServer } = require('./api-server');
const { loadDefaultKnowledgeBase } = require('../features/smart-coach/knowledge-base-loader');
const config = require('../utils/config');

// Allow self-signed certificates for localhost API
app.commandLine.appendSwitch('ignore-certificate-errors', 'localhost');
app.commandLine.appendSwitch('ignore-certificate-errors', '127.0.0.1');

// Handle app lifecycle
app.whenReady().then(() => {
  // Initialize security policies
  initializeSecurity();

  // Initialize session management
  initializeSessionManager();

  // Start API server
  startAPIServer();

  // Load knowledge base
  loadDefaultKnowledgeBase()
    .then(result => {
      if (result.loaded) {
        console.log(`Knowledge base loaded: ${result.filesLoaded} docs, ${result.chunksIndexed} chunks`);
      } else {
        console.warn('Knowledge base not loaded:', result.error);
      }
    })
    .catch(error => {
      console.error('Error loading knowledge base:', error);
    });

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
console.log('Secure Browser starting...');
console.log('Version:', app.getVersion());
console.log('Platform:', process.platform);


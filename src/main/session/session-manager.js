const { ipcMain } = require('electron');
const { generateToken } = require('./token-generator');
const { validateOrigin } = require('../security/origin-validator');

// Store active sessions
const activeSessions = new Map();

/**
 * Initialize session management and IPC handlers
 */
function initializeSessionManager() {
  // Handle session token requests from renderer process
  ipcMain.handle('get-session-token', async (event, params = {}) => {
    try {
      // Extract origin from params or event
      const origin = params.origin || event.sender.getURL() || 'file://';
      
      // Validate origin
      if (!validateOrigin(origin)) {
        throw new Error('Unauthorized origin: ' + origin);
      }

      // Get or create session for this origin
      let session = activeSessions.get(origin);
      
      if (!session || isSessionExpired(session)) {
        // Create new session
        session = {
          origin: origin,
          token: generateToken(),
          createdAt: Date.now(),
          expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
        };
        activeSessions.set(origin, session);
      }

      return session.token;
    } catch (error) {
      console.error('Error generating session token:', error);
      throw error;
    }
  });

  // Clean up expired sessions periodically
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Every 5 minutes

  console.log('Session manager initialized');
}

/**
 * Check if session is expired
 */
function isSessionExpired(session) {
  return Date.now() > session.expiresAt;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [origin, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(origin);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}

/**
 * Validate session token
 */
function validateToken(token, origin) {
  for (const [sessionOrigin, session] of activeSessions.entries()) {
    if (session.token === token && sessionOrigin === origin) {
      if (!isSessionExpired(session)) {
        return true;
      }
    }
  }
  return false;
}

module.exports = {
  initializeSessionManager,
  validateToken
};


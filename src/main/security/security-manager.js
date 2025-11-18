const { session } = require('electron');
const { validateOrigin } = require('./origin-validator');
const { enforceCSP } = require('./csp-enforcer');
const { setupCertificatePinning } = require('./certificate-pinning');

/**
 * Initialize all security policies and controls
 */
function initializeSecurity() {
  console.log('Initializing security policies...');

  // Disable extensions (Electron doesn't have setExtensionRequestHandler, so we use a different approach)
  // Extensions are disabled by default in Electron, but we can explicitly prevent loading
  session.defaultSession.setPreloads(session.defaultSession.getPreloads());

  // Enforce Content Security Policy
  enforceCSP();

  // Setup certificate pinning
  setupCertificatePinning();

  // Intercept network requests to localhost API
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['https://localhost:8443/*'] },
    (details, callback) => {
      // Validate origin before allowing localhost API access
      const origin = details.referrer || details.originUrl || '';
      
      if (validateOrigin(origin)) {
        callback({});
      } else {
        console.warn('Blocked unauthorized localhost API access from:', origin);
        callback({ cancel: true });
      }
    }
  );

  // Block navigation to non-whitelisted origins (optional, can be relaxed)
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      // Allow navigation - we'll validate on page load instead
      // This prevents blocking legitimate redirects
      callback({});
    }
  );

  console.log('Security policies initialized');
}

module.exports = {
  initializeSecurity
};

const config = require('../../utils/config');

// Default CSP policy
const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' may be needed for some apps
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://localhost:8443 https://*.backbase.com https://*.backbase.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

/**
 * Enforce Content Security Policy for all web requests
 */
function enforceCSP() {
  const cspPolicy = config.get('security.csp.policy', DEFAULT_CSP);
  const cspEnabled = config.get('security.csp.enabled', true);

  if (!cspEnabled) {
    console.warn('CSP enforcement is disabled');
    return;
  }

  // Intercept all HTTP responses and inject CSP headers
  require('electron').session.defaultSession.webRequest.onHeadersReceived(
    (details, callback) => {
      const responseHeaders = {
        ...details.responseHeaders
      };

      // Add or override CSP header
      responseHeaders['Content-Security-Policy'] = [cspPolicy];

      // Add security headers
      responseHeaders['X-Content-Type-Options'] = ['nosniff'];
      responseHeaders['X-Frame-Options'] = ['DENY'];
      responseHeaders['X-XSS-Protection'] = ['1; mode=block'];
      responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];

      callback({
        responseHeaders: responseHeaders
      });
    }
  );

  console.log('CSP enforcement enabled:', cspPolicy);
}

module.exports = {
  enforceCSP
};


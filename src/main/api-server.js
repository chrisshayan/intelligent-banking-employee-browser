const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const { validateToken, getOriginFromToken } = require('./session/session-manager');
const { validateOrigin } = require('./security/origin-validator');

let server = null;

/**
 * Start the localhost API server
 */
function startAPIServer() {
  const port = config.get('api.port', 8443);
  const host = config.get('api.host', '127.0.0.1');
  const tlsEnabled = config.get('api.tls.enabled', true);

  // Create HTTP/2 server
  const serverOptions = {};

  if (tlsEnabled) {
    // Try to load TLS certificates
    const certPath = config.get('api.tls.certPath');
    const keyPath = config.get('api.tls.keyPath');

    if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      serverOptions.cert = fs.readFileSync(certPath);
      serverOptions.key = fs.readFileSync(keyPath);
    } else {
      console.warn('TLS certificates not found. Generating self-signed certificate...');
      try {
        // Generate self-signed certificate for development
        const { generateSelfSignedCert } = require('../utils/certificate-generator');
        const cert = generateSelfSignedCert();
        serverOptions.cert = cert.cert;
        serverOptions.key = cert.key;
        console.log('Self-signed certificate generated');
      } catch (error) {
        console.error('Failed to generate certificate:', error.message);
        console.warn('Starting API server without TLS (HTTP only)');
        // Fall back to HTTP/2 without TLS (not recommended but works for testing)
        return startAPIServerHTTP();
      }
    }
  }

  server = http2.createSecureServer(serverOptions);

  // Handle requests
  server.on('request', (req, res) => {
    handleRequest(req, res);
  });

  // Handle errors
  server.on('error', (err) => {
    console.error('API Server error:', err);
  });

  // Start listening
  server.listen(port, host, () => {
    console.log(`API Server listening on https://${host}:${port}`);
  });

  return server;
}

/**
 * Start HTTP/2 server without TLS (fallback for development)
 */
function startAPIServerHTTP() {
  const port = config.get('api.port', 8443);
  const host = config.get('api.host', '127.0.0.1');
  
  console.warn('Starting API server without TLS (HTTP only) - NOT RECOMMENDED FOR PRODUCTION');
  
  // Note: HTTP/2 without TLS is not well supported, so we'd need to use HTTP/1.1
  // For now, just log the error and return null
  console.error('HTTP/2 without TLS is not supported. Please generate certificates.');
  return null;
}

/**
 * Stop the API server
 */
function stopAPIServer() {
  if (server) {
    server.close(() => {
      console.log('API Server stopped');
    });
    server = null;
  }
}

/**
 * Handle incoming HTTP/2 requests
 */
async function handleRequest(req, res) {
  const startTime = Date.now();

  // Set CORS headers (for localhost, we allow all)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Origin, Origin');

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `https://${req.headers[':authority'] || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated) {
      sendError(res, 401, 'Unauthorized', authResult.error);
      return;
    }

    // Route request
    const router = require('./api/router');
    const routeResult = await router.route(req, res, pathname, authResult);
    
    if (!routeResult.handled) {
      sendError(res, 404, 'Not Found', `Route not found: ${pathname}`);
    }

    // Log request
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${pathname} - ${res.statusCode || 200} (${duration}ms)`);
  } catch (error) {
    console.error('Request handling error:', error);
    sendError(res, 500, 'Internal Server Error', error.message);
  }
}

/**
 * Authenticate incoming request
 */
async function authenticateRequest(req) {
  // Extract token from Authorization header first
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid authorization header'
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Try to get origin from headers (check x-origin first, then standard headers)
  let origin = req.headers['x-origin'] || req.headers['origin'] || req.headers['referer'] || '';
  
  // If no origin in headers, try to find it from the token (for file:// URLs)
  if (!origin) {
    origin = getOriginFromToken(token);
    
    // If still no origin, allow file:// for development
    if (!origin) {
      origin = 'file://';
    }
  }
  
  // Validate origin
  if (!validateOrigin(origin)) {
    console.warn('Origin validation failed:', origin, 'Headers:', {
      referer: req.headers['referer'],
      origin: req.headers['origin'],
      'x-origin': req.headers['x-origin']
    });
    return {
      authenticated: false,
      error: 'Invalid origin'
    };
  }

  // Validate token
  if (!validateToken(token, origin)) {
    return {
      authenticated: false,
      error: 'Invalid or expired token'
    };
  }

  return {
    authenticated: true,
    origin: origin,
    token: token
  };
}

/**
 * Send error response
 */
function sendError(res, statusCode, statusMessage, error) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({
    error: statusMessage,
    message: error,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Parse request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  startAPIServer,
  stopAPIServer,
  parseBody,
  sendError
};


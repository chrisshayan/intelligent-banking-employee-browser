// Helper functions (moved here to avoid circular dependency)
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
const inferenceHandler = require('./routes/inference');
const ragHandler = require('./routes/rag');
const escalateHandler = require('./routes/escalate');
const healthHandler = require('./routes/health');

// Route definitions
const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthHandler
  },
  {
    method: 'POST',
    path: '/api/v1/inference',
    handler: inferenceHandler
  },
  {
    method: 'POST',
    path: '/api/v1/rag',
    handler: ragHandler
  },
  {
    method: 'POST',
    path: '/api/v1/escalate',
    handler: escalateHandler
  }
];

/**
 * Route incoming request to appropriate handler
 */
async function route(req, res, pathname, authResult) {
  // Find matching route
  const route = routes.find(r => {
    const methodMatch = r.method === req.method || r.method === '*';
    const pathMatch = r.path === pathname || matchPath(r.path, pathname);
    return methodMatch && pathMatch;
  });

  if (!route) {
    return { handled: false };
  }

  try {
    // Parse request body for POST requests
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await parseBody(req);
    }

    // Call route handler
    await route.handler(req, res, body, authResult);
    return { handled: true };
  } catch (error) {
    console.error('Route handler error:', error);
    sendError(res, 500, 'Internal Server Error', error.message);
    return { handled: true };
  }
}

/**
 * Match route path with wildcards
 */
function matchPath(pattern, path) {
  // Simple wildcard matching
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(path);
}

module.exports = {
  route
};


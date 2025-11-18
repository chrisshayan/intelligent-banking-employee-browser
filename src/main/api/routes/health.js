/**
 * Health check endpoint
 */
async function healthHandler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  
  res.end(JSON.stringify({
    status: 'ok',
    service: 'Smart Coach API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }));
}

module.exports = healthHandler;


const productAdvisorService = require('../../../features/product-advisor/product-advisor-service');

/**
 * Handle Product Advisor requests
 * POST /api/v1/product-advisor/recommend
 */
async function productAdvisorHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { clientData, options } = body;

    if (!clientData || !clientData.clientId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing required field: clientData.clientId'
      }));
      return;
    }

    // Generate product recommendations
    const result = await productAdvisorService.recommendProducts(clientData, options || {});

    // Calculate latency
    const latency_ms = Date.now() - startTime;

    // Send response
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({
      ...result,
      latency_ms: latency_ms
    }));
  } catch (error) {
    console.error('Product Advisor error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Product recommendation failed'
    }));
  }
}

module.exports = productAdvisorHandler;


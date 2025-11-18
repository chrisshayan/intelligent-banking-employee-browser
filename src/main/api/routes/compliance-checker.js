const complianceCheckerService = require('../../../features/compliance-checker/compliance-checker-service');

/**
 * Handle Compliance Checker requests
 * POST /api/v1/compliance/check
 */
async function complianceCheckerHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { content, contentType, context, regulations } = body;

    if (!content) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing required field: content'
      }));
      return;
    }

    // Run compliance check
    const result = await complianceCheckerService.checkCompliance({
      content,
      contentType,
      context,
      regulations
    });

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
    console.error('Compliance Checker error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Compliance check failed'
    }));
  }
}

module.exports = complianceCheckerHandler;


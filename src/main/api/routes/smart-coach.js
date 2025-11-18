const smartCoachService = require('../../../features/smart-coach/smart-coach-service');

/**
 * Handle Smart Coach requests
 * POST /api/v1/smart-coach/ask
 */
async function smartCoachHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { question, context } = body;

    if (!question || typeof question !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing or invalid question'
      }));
      return;
    }

    // Perform Smart Coach query
    const result = await smartCoachService.answerQuestion(question, context || {});

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
    console.error('Smart Coach error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Smart Coach query failed'
    }));
  }
}

module.exports = smartCoachHandler;


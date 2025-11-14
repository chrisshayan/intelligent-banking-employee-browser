const slmService = require('../../../services/slm-service');

/**
 * Handle inference requests
 * POST /api/v1/inference
 */
async function inferenceHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { prompt, max_tokens, temperature, top_p, top_k } = body;

    if (!prompt || typeof prompt !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing or invalid prompt'
      }));
      return;
    }

    // Default parameters
    const options = {
      max_tokens: max_tokens || 512,
      temperature: temperature || 0.7,
      top_p: top_p || 0.9,
      top_k: top_k || 50
    };

    // Perform inference
    const result = await slmService.infer(prompt, options);

    // Calculate latency
    const latency_ms = Date.now() - startTime;

    // Send response
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({
      text: result.text,
      tokens: result.tokens_generated || 0,
      latency_ms: latency_ms,
      confidence: result.confidence || 1.0
    }));
  } catch (error) {
    console.error('Inference error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Inference failed'
    }));
  }
}

module.exports = inferenceHandler;


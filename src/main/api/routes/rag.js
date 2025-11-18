const ragService = require('../../../services/rag-service');

/**
 * Handle RAG search requests
 * POST /api/v1/rag
 */
async function ragHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { query, top_k } = body;

    if (!query || typeof query !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing or invalid query'
      }));
      return;
    }

    // Default parameters
    const topK = top_k || 5;

    // Perform RAG search
    const results = await ragService.search(query, topK);

    // Calculate latency
    const latency_ms = Date.now() - startTime;

    // Send response
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({
      results: results,
      query: query,
      top_k: topK,
      latency_ms: latency_ms
    }));
  } catch (error) {
    console.error('RAG search error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'RAG search failed'
    }));
  }
}

module.exports = ragHandler;

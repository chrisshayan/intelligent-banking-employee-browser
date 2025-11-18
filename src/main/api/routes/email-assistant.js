const emailAssistantService = require('../../../features/email-assistant/email-assistant-service');

/**
 * Handle Email Assistant requests
 * POST /api/v1/email-assistant/generate
 */
async function emailAssistantHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { clientName, subject, purpose, context, tone, variations } = body;

    if (!clientName || !purpose) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing required fields: clientName and purpose'
      }));
      return;
    }

    // Generate email draft(s)
    let result;
    if (variations && variations > 1) {
      result = await emailAssistantService.generateEmailVariations(
        { clientName, subject, purpose, context, tone },
        variations
      );
    } else {
      result = await emailAssistantService.generateEmailDraft({
        clientName,
        subject,
        purpose,
        context,
        tone
      });
    }

    // Calculate latency
    const latency_ms = Date.now() - startTime;

    // Send response
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({
      ...(Array.isArray(result) ? { variations: result } : { email: result }),
      latency_ms: latency_ms
    }));
  } catch (error) {
    console.error('Email Assistant error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Email generation failed'
    }));
  }
}

module.exports = emailAssistantHandler;


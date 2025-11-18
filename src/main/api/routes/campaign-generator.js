const campaignGeneratorService = require('../../../features/campaign-generator/campaign-generator-service');

/**
 * Handle Campaign Generator requests
 * POST /api/v1/campaign/generate
 */
async function campaignGeneratorHandler(req, res, body, authResult) {
  const startTime = Date.now();

  try {
    // Validate request body
    const { campaignName, objective, targetAudience, channels, productInfo, brandGuidelines, generateVariations } = body;

    if (!campaignName || !objective) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: 'Missing required fields: campaignName and objective'
      }));
      return;
    }

    // Generate campaign content
    const result = await campaignGeneratorService.generateCampaignContent({
      campaignName,
      objective,
      targetAudience,
      channels: channels || ['email'],
      productInfo,
      brandGuidelines,
      generateVariations
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
    console.error('Campaign Generator error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'Campaign generation failed'
    }));
  }
}

module.exports = campaignGeneratorHandler;


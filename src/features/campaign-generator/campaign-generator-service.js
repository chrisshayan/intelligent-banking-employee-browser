const slmService = require('../../services/slm-service');
const ragService = require('../../services/rag-service');

/**
 * Campaign Content Generator Service
 * Generates marketing content for multiple channels (email, SMS, push notifications)
 */

/**
 * Generate campaign content
 * @param {object} params - Campaign generation parameters
 * @param {string} params.campaignName - Campaign name
 * @param {string} params.objective - Campaign objective (e.g., 'product launch', 'retention')
 * @param {string} params.targetAudience - Target audience segment
 * @param {Array<string>} params.channels - Channels to generate for (['email', 'sms', 'push'])
 * @param {object} params.productInfo - Product information
 * @param {object} params.brandGuidelines - Brand guidelines (tone, style, etc.)
 * @returns {Promise<object>} Generated campaign content
 */
async function generateCampaignContent(params) {
  const {
    campaignName,
    objective,
    targetAudience,
    channels = ['email'],
    productInfo = {},
    brandGuidelines = {}
  } = params;

  if (!campaignName || !objective) {
    throw new Error('campaignName and objective are required');
  }

  try {
    // Step 1: Search for relevant campaign templates or examples
    const templateResults = await ragService.search(
      `campaign template ${objective} ${targetAudience}`,
      3
    );

    // Step 2: Generate content for each channel
    const channelContent = {};
    
    for (const channel of channels) {
      const prompt = buildCampaignPrompt({
        campaignName,
        objective,
        targetAudience,
        channel,
        productInfo,
        brandGuidelines,
        templateContext: templateResults.map(r => r.text).join('\n\n')
      });

      const result = await slmService.infer(prompt, {
        max_tokens: 400,
        temperature: 0.8
      });

      channelContent[channel] = parseChannelContent(result.text, channel);
    }

    // Step 3: Generate A/B test variations if requested
    const variations = params.generateVariations ? 
      await generateVariations(params, channelContent) : null;

    return {
      campaignName,
      objective,
      targetAudience,
      channels: channelContent,
      variations: variations,
      complianceFlags: checkCompliance(channelContent),
      suggestions: generateCampaignSuggestions(channelContent, objective)
    };
  } catch (error) {
    console.error('Campaign generation error:', error);
    throw error;
  }
}

/**
 * Build prompt for campaign generation
 */
function buildCampaignPrompt({ campaignName, objective, targetAudience, channel, productInfo, brandGuidelines, templateContext }) {
  const tone = brandGuidelines.tone || 'engaging';
  const style = brandGuidelines.style || 'professional';
  
  let prompt = `Generate ${channel} content for a marketing campaign.\n\n`;
  prompt += `Campaign Name: ${campaignName}\n`;
  prompt += `Objective: ${objective}\n`;
  prompt += `Target Audience: ${targetAudience}\n`;
  prompt += `Channel: ${channel}\n`;
  prompt += `Tone: ${tone}\n`;
  prompt += `Style: ${style}\n\n`;

  if (Object.keys(productInfo).length > 0) {
    prompt += `Product Information:\n${JSON.stringify(productInfo, null, 2)}\n\n`;
  }

  if (templateContext) {
    prompt += `Reference Templates:\n${templateContext}\n\n`;
  }

  // Channel-specific instructions
  if (channel === 'email') {
    prompt += `Generate an email with:\n- Compelling subject line\n- Clear call-to-action\n- Product benefits\n- Compliance disclosures\n`;
  } else if (channel === 'sms') {
    prompt += `Generate SMS content (max 160 characters) with:\n- Clear message\n- Call-to-action\n- Link if applicable\n`;
  } else if (channel === 'push') {
    prompt += `Generate push notification (max 100 characters) with:\n- Attention-grabbing headline\n- Clear value proposition\n`;
  }

  prompt += `\nEnsure content is compliant with marketing regulations and brand guidelines.`;

  return prompt;
}

/**
 * Parse channel-specific content from SLM output
 */
function parseChannelContent(text, channel) {
  if (channel === 'email') {
    const subjectMatch = text.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';
    
    let body = text;
    if (subjectMatch) {
      body = text.substring(text.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
    }
    
    // Extract CTA if present
    const ctaMatch = body.match(/(?:CTA|Call to Action):\s*(.+)/i);
    const cta = ctaMatch ? ctaMatch[1].trim() : '';
    
    return {
      subject: subject || 'Campaign Email',
      body: body.replace(/(?:CTA|Call to Action):\s*.+/i, '').trim(),
      cta: cta,
      length: body.length
    };
  } else if (channel === 'sms') {
    // SMS should be short
    const smsText = text.split('\n')[0].substring(0, 160);
    return {
      message: smsText,
      length: smsText.length,
      withinLimit: smsText.length <= 160
    };
  } else if (channel === 'push') {
    // Push notification should be very short
    const pushText = text.split('\n')[0].substring(0, 100);
    return {
      title: pushText,
      length: pushText.length,
      withinLimit: pushText.length <= 100
    };
  }
  
  return {
    content: text,
    length: text.length
  };
}

/**
 * Generate A/B test variations
 */
async function generateVariations(params, baseContent) {
  const variations = {};
  
  for (const channel of Object.keys(baseContent)) {
    variations[channel] = [];
    
    // Generate 2 variations per channel
    for (let i = 0; i < 2; i++) {
      const variationParams = {
        ...params,
        channels: [channel],
        variationIndex: i
      };
      
      const prompt = buildCampaignPrompt({
        ...variationParams,
        templateContext: ''
      });
      
      const result = await slmService.infer(prompt, {
        max_tokens: 400,
        temperature: 0.9 // Higher temperature for more variation
      });
      
      variations[channel].push(parseChannelContent(result.text, channel));
    }
  }
  
  return variations;
}

/**
 * Check compliance flags
 */
function checkCompliance(channelContent) {
  const flags = [];
  
  for (const [channel, content] of Object.entries(channelContent)) {
    const text = JSON.stringify(content).toLowerCase();
    
    // Check for required disclosures
    if (text.includes('product') || text.includes('offer')) {
      if (!text.includes('terms') && !text.includes('conditions')) {
        flags.push({
          channel,
          type: 'missing_disclosure',
          severity: 'medium',
          message: 'Product mention without terms/conditions disclosure'
        });
      }
    }
    
    // Check for misleading claims
    const misleadingWords = ['guaranteed', 'risk-free', 'always'];
    for (const word of misleadingWords) {
      if (text.includes(word)) {
        flags.push({
          channel,
          type: 'misleading_claim',
          severity: 'high',
          message: `Potentially misleading word: "${word}"`
        });
      }
    }
  }
  
  return flags;
}

/**
 * Generate campaign suggestions
 */
function generateCampaignSuggestions(channelContent, objective) {
  const suggestions = [];
  
  // Check content length
  for (const [channel, content] of Object.entries(channelContent)) {
    if (channel === 'email' && content.length < 200) {
      suggestions.push(`Email content might be too short. Consider adding more details.`);
    }
    
    if (channel === 'sms' && !content.withinLimit) {
      suggestions.push(`SMS exceeds 160 character limit. Consider shortening.`);
    }
    
    if (channel === 'push' && !content.withinLimit) {
      suggestions.push(`Push notification exceeds 100 character limit. Consider shortening.`);
    }
  }
  
  // Objective-specific suggestions
  if (objective.includes('retention')) {
    suggestions.push('Consider adding personalized offers for retention campaigns.');
  }
  
  if (objective.includes('launch')) {
    suggestions.push('Ensure product launch campaigns include clear value proposition.');
  }
  
  return suggestions;
}

module.exports = {
  generateCampaignContent
};


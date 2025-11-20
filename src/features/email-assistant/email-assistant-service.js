const slmService = require('../../services/slm-service');
const ragService = require('../../services/rag-service');

/**
 * Email Draft Assistant Service
 * Generates context-aware email drafts for client communications
 */

/**
 * Generate email draft
 * @param {object} params - Email generation parameters
 * @param {string} params.clientName - Client name
 * @param {string} params.subject - Email subject (optional)
 * @param {string} params.purpose - Purpose of email (e.g., 'product recommendation', 'follow-up')
 * @param {object} params.context - Additional context (client data, previous interactions, etc.)
 * @param {string} params.tone - Email tone (e.g., 'professional', 'friendly', 'formal')
 * @returns {Promise<object>} Generated email draft
 */
async function generateEmailDraft(params) {
  const {
    clientName,
    subject,
    purpose,
    context = {},
    tone = 'professional'
  } = params;

  if (!clientName || !purpose) {
    throw new Error('clientName and purpose are required');
  }

  try {
    // Step 1: Search for relevant templates or examples
    const templateResults = await ragService.search(
      `email template ${purpose} ${tone}`,
      3
    );

    // Step 2: Build context from RAG results and provided context
    const templateContext = templateResults
      .map(r => r.text)
      .join('\n\n');

    // Step 3: Construct prompt for email generation
    const prompt = buildEmailPrompt({
      clientName,
      subject,
      purpose,
      context,
      tone,
      templateContext
    });

    // Step 4: Generate email using SLM
    const result = await slmService.infer(prompt, {
      max_tokens: 500,
      temperature: 0.8 // Slightly higher for more creative email generation
    });

    // Step 5: Clean and parse email
    const cleanedText = cleanEmailResponse(result.text);
    const email = parseEmailDraft(cleanedText, subject);

    return {
      to: context.email || `${clientName}@example.com`,
      subject: email.subject || subject || `Re: ${purpose}`,
      body: email.body,
      tone: tone,
      purpose: purpose,
      confidence: result.confidence,
      suggestions: generateSuggestions(email.body, tone)
    };
  } catch (error) {
    console.error('Email generation error:', error);
    throw error;
  }
}

/**
 * Build prompt for email generation
 */
function buildEmailPrompt({ clientName, subject, purpose, context, tone, templateContext }) {
  const clientInfo = context.clientInfo || {};
  const previousInteractions = context.previousInteractions || [];
  
  let contextText = `Generate a ${tone} email to ${clientName}`;
  
  if (clientInfo.tier) {
    contextText += ` (${clientInfo.tier} tier client)`;
  }
  
  contextText += `.\n\nPurpose: ${purpose}\n`;
  
  if (subject) {
    contextText += `Subject: ${subject}\n`;
  }
  
  if (Object.keys(clientInfo).length > 0) {
    contextText += `\nClient Information:\n${JSON.stringify(clientInfo, null, 2)}\n`;
  }
  
  if (previousInteractions.length > 0) {
    contextText += `\nPrevious Interactions:\n${previousInteractions.slice(-3).join('\n')}\n`;
  }
  
  if (templateContext && templateContext.trim().length > 0) {
    contextText += `\nEmail Templates/Examples:\n${templateContext}\n`;
  } else {
    contextText += `\nNote: Use standard banking email format - professional greeting, clear purpose, helpful content, professional closing.`;
  }
  
  contextText += `\n\nGenerate a professional, compliant email draft. Output only the email content - no instructions, explanations, or meta-commentary. Start directly with the email subject and body.`;
  
  return contextText;
}

/**
 * Parse email draft from SLM output
 */
function parseEmailDraft(text, defaultSubject) {
  // Try to extract subject and body
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : defaultSubject;
  
  // Extract body (everything after subject or the whole text)
  let body = text;
  if (subjectMatch) {
    body = text.substring(text.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
  }
  
  // Clean up common artifacts
  body = body.replace(/^(Dear|Hello|Hi)\s+/i, '');
  body = body.replace(/\n{3,}/g, '\n\n');
  
  return {
    subject: subject || defaultSubject || 'Email Draft',
    body: body.trim()
  };
}

/**
 * Generate suggestions for email improvement
 */
function generateSuggestions(emailBody, tone) {
  const suggestions = [];
  
  // Check length
  if (emailBody.length < 100) {
    suggestions.push('Consider adding more detail to provide context');
  } else if (emailBody.length > 1000) {
    suggestions.push('Email might be too long - consider condensing');
  }
  
  // Check for compliance keywords
  const complianceKeywords = ['disclosure', 'terms', 'conditions', 'risk'];
  const hasCompliance = complianceKeywords.some(keyword => 
    emailBody.toLowerCase().includes(keyword)
  );
  
  if (!hasCompliance && emailBody.toLowerCase().includes('product')) {
    suggestions.push('Consider adding compliance disclosures for product mentions');
  }
  
  // Tone suggestions
  if (tone === 'professional' && emailBody.includes('!')) {
    suggestions.push('Consider using fewer exclamation marks for professional tone');
  }
  
  return suggestions;
}

/**
 * Generate multiple email variations
 * @param {object} params - Email generation parameters
 * @param {number} count - Number of variations to generate
 * @returns {Promise<Array>} Array of email drafts
 */
async function generateEmailVariations(params, count = 3) {
  const variations = [];
  const tones = ['professional', 'friendly', 'formal'];
  
  for (let i = 0; i < count; i++) {
    const variationParams = {
      ...params,
      tone: tones[i % tones.length]
    };
    
    const draft = await generateEmailDraft(variationParams);
    variations.push(draft);
  }
  
  return variations;
}

/**
 * Clean up email response to remove instructions and meta-commentary
 */
function cleanEmailResponse(text) {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove instruction patterns
  const instructionPatterns = [
    /^Do not include.*?\.\s*/gmi,
    /^Instructions?:.*?$/gmi,
    /^- Do not.*?$/gmi,
    /^- If.*?$/gmi,
    /^Note:.*?$/gmi,
    /^Generate.*?email.*?$/gmi,
    /^Output only.*?$/gmi,
    /^Start directly.*?$/gmi,
  ];
  
  for (const pattern of instructionPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove lines that are just instructions
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('do not') || 
        lower.startsWith('instructions') ||
        lower.startsWith('note:') ||
        lower.startsWith('generate') ||
        lower.startsWith('output only') ||
        lower.startsWith('start directly')) {
      return false;
    }
    
    return true;
  });
  
  cleaned = filteredLines.join('\n').trim();
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

module.exports = {
  generateEmailDraft,
  generateEmailVariations
};


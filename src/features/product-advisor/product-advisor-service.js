const slmService = require('../../services/slm-service');
const ragService = require('../../services/rag-service');

/**
 * Product Recommendation Advisor Service
 * Analyzes client profiles and recommends suitable products
 */

/**
 * Recommend products for a client
 * @param {object} clientData - Client profile data
 * @param {string} clientData.clientId - Client identifier
 * @param {object} clientData.profile - Client profile
 * @param {number} clientData.profile.balance - Current balance
 * @param {string} clientData.profile.tier - Client tier (Premium, Standard, Basic)
 * @param {Array<string>} clientData.profile.currentProducts - Currently held products
 * @param {object} clientData.profile.goals - Client financial goals
 * @param {object} clientData.profile.riskTolerance - Risk tolerance level
 * @param {object} options - Recommendation options
 * @param {number} options.maxRecommendations - Maximum number of recommendations
 * @returns {Promise<object>} Product recommendations with rationale
 */
async function recommendProducts(clientData, options = {}) {
  const {
    clientId,
    profile = {}
  } = clientData;

  const {
    maxRecommendations = 5
  } = options;

  if (!clientId) {
    throw new Error('clientId is required');
  }

  try {
    // Step 1: Search for relevant products based on client profile
    const searchQuery = buildProductSearchQuery(profile);
    const productResults = await ragService.search(searchQuery, 10);

    // Step 2: Analyze client profile and match products
    const analysisPrompt = buildAnalysisPrompt(profile, productResults);
    const analysisResult = await slmService.infer(analysisPrompt, {
      max_tokens: 300,
      temperature: 0.7
    });

    // Step 3: Generate recommendations with rationale
    const recommendationsPrompt = buildRecommendationsPrompt(
      profile,
      productResults,
      analysisResult.text,
      maxRecommendations
    );
    
    const recommendationsResult = await slmService.infer(recommendationsPrompt, {
      max_tokens: 500,
      temperature: 0.7
    });

    // Step 4: Parse and structure recommendations
    const recommendations = parseRecommendations(recommendationsResult.text, productResults);

    // Step 5: Calculate risk scores and match scores
    const enrichedRecommendations = recommendations.map(rec => ({
      ...rec,
      matchScore: calculateMatchScore(rec, profile),
      riskLevel: assessRisk(rec, profile)
    }));

    // Sort by match score
    enrichedRecommendations.sort((a, b) => b.matchScore - a.matchScore);

    return {
      clientId,
      recommendations: enrichedRecommendations.slice(0, maxRecommendations),
      analysis: analysisResult.text,
      totalProductsConsidered: productResults.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Product recommendation error:', error);
    throw error;
  }
}

/**
 * Build search query for products
 */
function buildProductSearchQuery(profile) {
  const queries = [];
  
  if (profile.tier) {
    queries.push(`${profile.tier} tier products`);
  }
  
  if (profile.goals) {
    if (profile.goals.savings) queries.push('savings products');
    if (profile.goals.investment) queries.push('investment products');
    if (profile.goals.retirement) queries.push('retirement products');
  }
  
  if (profile.balance) {
    if (profile.balance > 100000) {
      queries.push('premium products high balance');
    } else if (profile.balance > 10000) {
      queries.push('standard products');
    }
  }
  
  return queries.join(' ') || 'banking products';
}

/**
 * Build prompt for client profile analysis
 */
function buildAnalysisPrompt(profile, productResults) {
  const productContext = productResults
    .slice(0, 5)
    .map((r, i) => `[Product ${i + 1}]\n${r.text}`)
    .join('\n\n');

  return `Analyze this client profile and identify key characteristics for product matching:

Client Profile:
- Balance: $${profile.balance || 'N/A'}
- Tier: ${profile.tier || 'N/A'}
- Current Products: ${(profile.currentProducts || []).join(', ') || 'None'}
- Goals: ${JSON.stringify(profile.goals || {})}
- Risk Tolerance: ${profile.riskTolerance || 'N/A'}

Available Products:
${productContext}

Identify:
1. Client's primary financial needs
2. Suitable product categories
3. Key matching criteria
4. Potential risks or concerns`;
}

/**
 * Build prompt for generating recommendations
 */
function buildRecommendationsPrompt(profile, productResults, analysis, maxRecommendations) {
  const productContext = productResults
    .slice(0, 8)
    .map((r, i) => `[Product ${i + 1}: ${r.source || 'Unknown'}]\n${r.text}`)
    .join('\n\n');

  return `Based on the client analysis and available products, generate ${maxRecommendations} product recommendations.

Client Analysis:
${analysis}

Available Products:
${productContext}

For each recommendation, provide:
1. Product name
2. Brief description
3. Why it matches the client
4. Key benefits
5. Any considerations or requirements

Format as JSON array with fields: name, description, rationale, benefits, considerations`;
}

/**
 * Parse recommendations from SLM output
 */
function parseRecommendations(text, productResults) {
  const recommendations = [];
  
  // Try to extract JSON array
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map(rec => ({
        ...rec,
        source: findProductSource(rec.name, productResults)
      }));
    }
  } catch (e) {
    // Fall back to text parsing
  }
  
  // Parse text format
  const sections = text.split(/\d+\.\s+/).filter(s => s.trim());
  
  for (const section of sections.slice(0, 5)) {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;
    
    const nameMatch = section.match(/Product[:\s]+(.+?)(?:\n|$)/i);
    const name = nameMatch ? nameMatch[1].trim() : lines[0].trim();
    
    recommendations.push({
      name: name,
      description: lines.slice(1, 3).join(' ').substring(0, 200),
      rationale: section.substring(0, 300),
      benefits: extractList(section, /benefits?[:\s]+(.+?)(?:\n|$)/i),
      considerations: extractList(section, /considerations?[:\s]+(.+?)(?:\n|$)/i),
      source: findProductSource(name, productResults)
    });
  }
  
  return recommendations;
}

/**
 * Find product source from RAG results
 */
function findProductSource(productName, productResults) {
  const nameLower = productName.toLowerCase();
  for (const result of productResults) {
    if (result.text.toLowerCase().includes(nameLower) || 
        (result.source && result.source.toLowerCase().includes(nameLower))) {
      return result.source || 'Product Catalog';
    }
  }
  return 'Product Catalog';
}

/**
 * Extract list items from text
 */
function extractList(text, pattern) {
  const match = text.match(pattern);
  if (!match) return [];
  
  const listText = match[1];
  return listText.split(/[,\n-]/).map(item => item.trim()).filter(item => item);
}

/**
 * Calculate match score (0-100)
 */
function calculateMatchScore(recommendation, profile) {
  let score = 50; // Base score
  
  // Tier matching
  if (recommendation.source && profile.tier) {
    if (recommendation.source.toLowerCase().includes(profile.tier.toLowerCase())) {
      score += 20;
    }
  }
  
  // Balance matching
  if (profile.balance) {
    const recText = JSON.stringify(recommendation).toLowerCase();
    if (profile.balance > 100000 && recText.includes('premium')) {
      score += 15;
    } else if (profile.balance < 10000 && recText.includes('basic')) {
      score += 15;
    }
  }
  
  // Goal matching
  if (profile.goals) {
    const recText = JSON.stringify(recommendation).toLowerCase();
    if (profile.goals.savings && recText.includes('savings')) score += 10;
    if (profile.goals.investment && recText.includes('investment')) score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Assess risk level
 */
function assessRisk(recommendation, profile) {
  const recText = JSON.stringify(recommendation).toLowerCase();
  
  if (recText.includes('high risk') || recText.includes('volatile')) {
    return 'high';
  }
  
  if (recText.includes('moderate') || recText.includes('medium')) {
    return 'medium';
  }
  
  if (recText.includes('low risk') || recText.includes('safe')) {
    return 'low';
  }
  
  // Default based on product type
  if (recText.includes('investment') || recText.includes('trading')) {
    return profile.riskTolerance === 'high' ? 'medium' : 'high';
  }
  
  return 'low';
}

module.exports = {
  recommendProducts
};


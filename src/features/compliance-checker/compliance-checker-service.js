const slmService = require('../../services/slm-service');
const ragService = require('../../services/rag-service');

/**
 * Compliance Checker Service
 * Real-time compliance verification for content and actions
 */

/**
 * Check content for compliance
 * @param {object} params - Compliance check parameters
 * @param {string} params.content - Content to check
 * @param {string} params.contentType - Type of content (email, sms, document, etc.)
 * @param {object} params.context - Additional context (client data, product info, etc.)
 * @param {Array<string>} params.regulations - Specific regulations to check (optional)
 * @returns {Promise<object>} Compliance check results
 */
async function checkCompliance(params) {
  const {
    content,
    contentType = 'general',
    context = {},
    regulations = []
  } = params;

  if (!content) {
    throw new Error('content is required');
  }

  try {
    // Step 1: Search for relevant compliance rules
    const searchQuery = buildComplianceSearchQuery(contentType, regulations, context);
    const complianceResults = await ragService.search(searchQuery, 5);

    // Step 2: Build compliance check prompt
    const checkPrompt = buildCompliancePrompt(content, contentType, context, complianceResults);

    // Step 3: Run compliance check using SLM
    const checkResult = await slmService.infer(checkPrompt, {
      max_tokens: 400,
      temperature: 0.3 // Lower temperature for more consistent compliance checks
    });

    // Step 4: Parse compliance results
    const compliance = parseComplianceResults(checkResult.text, complianceResults);

    // Step 5: Run additional automated checks
    const automatedChecks = runAutomatedChecks(content, contentType, context);

    // Step 6: Combine results
    const allIssues = [...compliance.issues, ...automatedChecks.issues];
    const allWarnings = [...compliance.warnings, ...automatedChecks.warnings];

    // Determine overall status
    const status = determineComplianceStatus(allIssues, allWarnings);

    return {
      status, // 'compliant', 'warning', 'non_compliant'
      issues: allIssues,
      warnings: allWarnings,
      checks: {
        automated: automatedChecks.checks,
        ai_reviewed: compliance.checks
      },
      recommendations: generateRecommendations(allIssues, allWarnings),
      regulationsChecked: regulations.length > 0 ? regulations : ['general'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Compliance check error:', error);
    throw error;
  }
}

/**
 * Build search query for compliance rules
 */
function buildComplianceSearchQuery(contentType, regulations, context) {
  const queries = [];
  
  if (regulations.length > 0) {
    queries.push(...regulations);
  } else {
    queries.push('compliance rules');
  }
  
  if (contentType === 'email' || contentType === 'sms') {
    queries.push('marketing compliance');
    queries.push('communication regulations');
  }
  
  if (contentType === 'document') {
    queries.push('document compliance');
    queries.push('disclosure requirements');
  }
  
  if (context.productInfo) {
    queries.push('product disclosure requirements');
  }
  
  return queries.join(' ');
}

/**
 * Build compliance check prompt
 */
function buildCompliancePrompt(content, contentType, context, complianceResults) {
  const rulesContext = complianceResults
    .map((r, i) => `[Rule ${i + 1}]\n${r.text}`)
    .join('\n\n');

  return `Check the following ${contentType} content for compliance with banking regulations:

Content to Check:
${content.substring(0, 2000)}

Content Type: ${contentType}
Context: ${JSON.stringify(context, null, 2)}

Compliance Rules:
${rulesContext}

Analyze the content and identify:
1. Any compliance violations (issues)
2. Potential compliance concerns (warnings)
3. Missing required disclosures
4. Misleading or prohibited language
5. Data privacy concerns

Format response as JSON with:
{
  "issues": [{"type": "...", "severity": "high|medium|low", "description": "...", "rule": "..."}],
  "warnings": [{"type": "...", "description": "...", "suggestion": "..."}],
  "checks": ["check1", "check2"]
}`;
}

/**
 * Parse compliance results from SLM output
 */
function parseComplianceResults(text, complianceResults) {
  let issues = [];
  let warnings = [];
  let checks = [];

  // Try to extract JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      issues = parsed.issues || [];
      warnings = parsed.warnings || [];
      checks = parsed.checks || [];
    }
  } catch (e) {
    // Fall back to text parsing
    const issueMatches = text.matchAll(/issue[:\s]+(.+?)(?:\n|$)/gi);
    for (const match of issueMatches) {
      issues.push({
        type: 'general',
        severity: 'medium',
        description: match[1].trim()
      });
    }
    
    const warningMatches = text.matchAll(/warning[:\s]+(.+?)(?:\n|$)/gi);
    for (const match of warningMatches) {
      warnings.push({
        type: 'general',
        description: match[1].trim()
      });
    }
  }

  return { issues, warnings, checks };
}

/**
 * Run automated compliance checks
 */
function runAutomatedChecks(content, contentType, context) {
  const issues = [];
  const warnings = [];
  const checks = [];

  const contentLower = content.toLowerCase();

  // Check for prohibited words
  const prohibitedWords = ['guaranteed returns', 'risk-free', 'always profitable', 'no risk'];
  for (const word of prohibitedWords) {
    if (contentLower.includes(word)) {
      issues.push({
        type: 'prohibited_language',
        severity: 'high',
        description: `Prohibited phrase found: "${word}"`,
        rule: 'Marketing communications cannot make absolute guarantees'
      });
    }
  }

  // Check for required disclosures
  if (contentType === 'email' || contentType === 'sms') {
    if (contentLower.includes('product') || contentLower.includes('offer')) {
      if (!contentLower.includes('terms') && !contentLower.includes('conditions')) {
        warnings.push({
          type: 'missing_disclosure',
          description: 'Product mention without terms/conditions disclosure',
          suggestion: 'Add terms and conditions disclosure'
        });
      }
    }
  }

  // Check for data privacy concerns
  if (contentLower.includes('personal information') || contentLower.includes('ssn') || contentLower.includes('account number')) {
    warnings.push({
      type: 'data_privacy',
      description: 'Content may contain sensitive personal information',
      suggestion: 'Review data handling and privacy compliance'
    });
  }

  // Check length for SMS
  if (contentType === 'sms' && content.length > 160) {
    warnings.push({
      type: 'length',
      description: `SMS content exceeds 160 characters (${content.length} chars)`,
      suggestion: 'Consider splitting into multiple messages or shortening'
    });
  }

  checks.push('prohibited_language_check', 'disclosure_check', 'privacy_check', 'length_check');

  return { issues, warnings, checks };
}

/**
 * Determine overall compliance status
 */
function determineComplianceStatus(issues, warnings) {
  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  
  if (highSeverityIssues.length > 0) {
    return 'non_compliant';
  }
  
  if (issues.length > 0 || warnings.length > 2) {
    return 'warning';
  }
  
  return 'compliant';
}

/**
 * Generate recommendations for fixing issues
 */
function generateRecommendations(issues, warnings) {
  const recommendations = [];

  for (const issue of issues) {
    if (issue.type === 'prohibited_language') {
      recommendations.push('Remove or rephrase absolute guarantees. Use qualified language instead.');
    } else if (issue.type === 'missing_disclosure') {
      recommendations.push('Add required disclosures and terms/conditions.');
    }
  }

  for (const warning of warnings) {
    if (warning.suggestion) {
      recommendations.push(warning.suggestion);
    }
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

module.exports = {
  checkCompliance
};


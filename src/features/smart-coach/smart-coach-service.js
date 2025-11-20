const ragService = require('../../services/rag-service');
const slmService = require('../../services/slm-service');
const documentProcessor = require('../../utils/document-processor');

// Smart Coach - RAG-powered Q&A for bank docs

async function answerQuestion(question, context = {}) {
  const startTime = Date.now();

  try {
    // Search for relevant context
    const ragResults = await ragService.search(question, 5);

    // Build context string
    const contextText = ragResults
      .map((result, index) => `[Source ${index + 1}: ${result.source}]\n${result.text}`)
      .join('\n\n');

    const prompt = buildPrompt(question, contextText, context);

    // Generate answer
    const inferenceResult = await slmService.infer(prompt, {
      max_tokens: 500,
      temperature: 0.7
    });

    // Clean up the response - remove instructions, meta-commentary, and formatting artifacts
    let cleanedAnswer = cleanResponse(inferenceResult.text);

    const latency = Date.now() - startTime;

    return {
      answer: cleanedAnswer,
      sources: ragResults.map(r => ({
        text: r.text.substring(0, 200) + (r.text.length > 200 ? '...' : ''),
        source: r.source,
        score: r.score,
        metadata: r.metadata
      })),
      confidence: inferenceResult.confidence,
      latency_ms: latency,
      query: question
    };
  } catch (error) {
    console.error('Smart Coach error:', error);
    throw error;
  }
}

function buildPrompt(question, context, userContext) {
  const roleContext = userContext.role ? `\nUser Role: ${userContext.role}` : '';
  const pageContext = userContext.page ? `\nCurrent Page: ${userContext.page}` : '';

  // If no context was found, provide helpful guidance
  const hasContext = context && context.trim().length > 0;
  const contextSection = hasContext 
    ? `Context from bank documentation:\n${context}`
    : `Note: No specific documentation was found for this question. Use your general banking knowledge to provide a helpful answer.`;

  return `You are a helpful banking assistant. Answer the question directly and concisely.

${roleContext}${pageContext}

${contextSection}

Question: ${question}

Answer:`;
}

async function indexKnowledgeBase(documents, metadata = []) {
  // TODO: optimize chunking for large document sets
  const chunks = [];
  for (let i = 0; i < documents.length; i++) {
    const docChunks = documentProcessor.chunkWithSemantics(documents[i], 512);
    const docMetadata = metadata[i] || {};
    
    for (const chunk of docChunks) {
      chunks.push({
        text: chunk.text,
        metadata: {
          ...docMetadata,
          chunkIndex: chunk.index,
          chunkStart: chunk.start,
          chunkEnd: chunk.end
        }
      });
    }
  }

  // Extract texts and metadata
  const texts = chunks.map(c => c.text);
  const chunkMetadata = chunks.map(c => c.metadata);

  // Index in RAG
  const result = await ragService.addDocuments(texts, chunkMetadata);

  return {
    documentsIndexed: documents.length,
    chunksIndexed: result.indexed,
    totalChunks: result.total
  };
}

function getKnowledgeBaseStats() {
  return ragService.getIndexStats();
}

/**
 * Clean up model response to remove instructions, meta-commentary, and formatting artifacts
 */
function cleanResponse(text) {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove common instruction patterns
  const instructionPatterns = [
    /^Do not include.*?\.\s*/gmi,
    /^If you're.*?\.\s*/gmi,
    /^Instructions?:.*?$/gmi,
    /^- Do not.*?$/gmi,
    /^- If.*?$/gmi,
    /^Note:.*?$/gmi,
    /^OR\s+/gmi,
    /^Customer Value Profit.*?not value profit.*?$/gmi,
    /^The question asks.*?$/gmi,
    /^Since the provided context.*?$/gmi,
    /^I will provide.*?$/gmi,
    /^To calculate.*?$/gmi,
    /^You would follow.*?$/gmi,
    /^1\.\s*Determine.*?$/gmi,
    /^2\.\s*Calculate.*?$/gmi,
    /^\[.*?\]/g, // Remove bracketed notes
  ];
  
  for (const pattern of instructionPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove lines that are just instructions
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // Keep empty lines for spacing
    
    // Remove lines that look like instructions
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('do not') || 
        lower.startsWith('if the question') ||
        lower.startsWith('if you') ||
        lower.startsWith('instructions') ||
        lower.startsWith('note:') ||
        lower.startsWith('the question asks') ||
        lower.startsWith('since the provided') ||
        lower.startsWith('i will') ||
        lower.startsWith('to calculate') ||
        lower.startsWith('you would') ||
        lower.match(/^\d+\.\s*(determine|calculate|identify|assess)/i)) {
      return false;
    }
    
    return true;
  });
  
  cleaned = filteredLines.join('\n').trim();
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // If the response starts with "Answer:" or similar, remove it
  cleaned = cleaned.replace(/^(Answer|Response|Output):\s*/i, '');
  
  return cleaned.trim();
}

module.exports = {
  answerQuestion,
  indexKnowledgeBase,
  getKnowledgeBaseStats
};


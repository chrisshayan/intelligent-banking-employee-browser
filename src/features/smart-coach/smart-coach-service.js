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
      max_tokens: 300,
      temperature: 0.7
    });

    const latency = Date.now() - startTime;

    return {
      answer: inferenceResult.text,
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

  return `You are a helpful banking assistant. Answer the following question based on the provided context from bank documentation.

${roleContext}${pageContext}

Context from bank documentation:
${context}

Question: ${question}

Provide a clear, concise answer based on the context. If the context doesn't contain enough information, say so.`;
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

module.exports = {
  answerQuestion,
  indexKnowledgeBase,
  getKnowledgeBaseStats
};


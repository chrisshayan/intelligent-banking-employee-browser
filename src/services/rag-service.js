const fs = require('fs');
const path = require('path');
const embeddingService = require('./embedding-service');

// Try to load native RAG index module
let ragNative = null;
try {
  ragNative = require('../native/rag-index/build/Release/rag_index.node');
  console.log('✅ RAG native module loaded successfully');
} catch (error) {
  console.warn('⚠️  RAG native module not available:', error.message);
  console.warn('   Falling back to mock implementation');
}

let indexInitialized = false;

/**
 * Initialize the RAG index
 */
function initializeIndex() {
  if (indexInitialized) {
    return true;
  }

  if (!ragNative) {
    console.warn('RAG native module not available');
    return false;
  }

  indexInitialized = true;
  console.log('✅ RAG index initialized');
  return true;
}

/**
 * Search the RAG index
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Search results
 */
async function search(query, topK = 5) {
  // Initialize if needed
  if (!indexInitialized) {
    initializeIndex();
  }

  // If native module is available, use it
  if (ragNative && indexInitialized) {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Search using native module
      const results = ragNative.search(queryEmbedding, topK);
      
      // Convert to array format
      const searchResults = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        searchResults.push({
          text: result.text,
          source: result.source,
          score: result.score,
          metadata: result.metadata || {}
        });
      }
      
      return searchResults;
    } catch (error) {
      console.error('Native RAG search error:', error);
      // Fall through to mock
    }
  }

  // Fallback to mock implementation
  console.log('RAG Service: Using mock search (native module:', !!ragNative, ', initialized:', indexInitialized, ')');
  
  await new Promise(resolve => setTimeout(resolve, 50));

  return [
    {
      text: 'This is a mock search result. The actual RAG implementation will use vector similarity search.',
      source: 'mock-document-1.pdf',
      score: 0.95,
      metadata: {
        page: 1,
        section: 'Introduction'
      }
    },
    {
      text: 'RAG (Retrieval-Augmented Generation) combines information retrieval with language generation.',
      source: 'mock-document-2.pdf',
      score: 0.87,
      metadata: {
        page: 5,
        section: 'RAG Overview'
      }
    }
  ].slice(0, topK);
}

/**
 * Add documents to the RAG index
 * @param {Array<string>} texts - Array of document texts
 * @param {Array<object>} metadata - Array of metadata objects
 */
async function addDocuments(texts, metadata = []) {
  // Initialize if needed
  if (!indexInitialized) {
    initializeIndex();
  }

  if (!ragNative || !indexInitialized) {
    console.warn('RAG native module not available, cannot add documents');
    return {
      indexed: 0,
      status: 'error',
      message: 'Native module not available'
    };
  }

  try {
    // Generate embeddings for all texts
    console.log(`Generating embeddings for ${texts.length} documents...`);
    const embeddings = await embeddingService.generateEmbeddings(texts);
    
    // Add to native index
    const result = ragNative.addDocuments(texts, embeddings);
    
    console.log(`✅ Added ${result.added} documents to RAG index (total: ${result.total})`);
    
    return {
      indexed: result.added,
      total: result.total,
      status: 'success'
    };
  } catch (error) {
    console.error('Error adding documents to RAG index:', error);
    return {
      indexed: 0,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Add documents from files
 * @param {Array<string>} filePaths - Array of file paths
 */
async function addDocumentsFromFiles(filePaths) {
  const texts = [];
  const metadata = [];

  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      texts.push(content);
      metadata.push({
        source: path.basename(filePath),
        path: filePath,
        size: content.length
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  return await addDocuments(texts, metadata);
}

/**
 * Get index statistics
 * @returns {object} Index statistics
 */
function getIndexStats() {
  if (ragNative && indexInitialized) {
    try {
      const stats = ragNative.getStats();
      return {
        documentCount: stats.documentCount || 0,
        dimension: stats.dimension || embeddingService.getDimension(),
        status: 'ready',
        backend: stats.backend || 'native'
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
    }
  }

  return {
    documentCount: 0,
    dimension: embeddingService.getDimension(),
    status: ragNative ? 'not_initialized' : 'native_unavailable',
    backend: 'mock'
  };
}

/**
 * Clear the index
 */
function clearIndex() {
  if (ragNative && indexInitialized) {
    try {
      const result = ragNative.clear();
      console.log(`Cleared ${result.cleared} documents from index`);
      return result.cleared;
    } catch (error) {
      console.error('Error clearing index:', error);
    }
  }
  return 0;
}

// Initialize on module load
initializeIndex();

module.exports = {
  search,
  addDocuments,
  addDocumentsFromFiles,
  getIndexStats,
  clearIndex
};

const config = require('../utils/config');

/**
 * Embedding Service - Generates embeddings for text
 * For now, uses a simple mock implementation
 * In production, this would use ONNX Runtime with an embedding model (e.g., all-MiniLM-L6-v2)
 */

const EMBEDDING_DIMENSION = 384; // all-MiniLM-L6-v2 dimension

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function generateEmbedding(text) {
  // TODO: Implement actual embedding generation using ONNX Runtime
  // For now, return a mock embedding (normalized random vector)
  
  const embedding = [];
  let sumSquares = 0;
  
  // Generate random values
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    const value = Math.random() * 2 - 1; // -1 to 1
    embedding.push(value);
    sumSquares += value * value;
  }
  
  // Normalize to unit vector
  const norm = Math.sqrt(sumSquares);
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  // Add some deterministic component based on text hash for consistency
  const hash = simpleHash(text);
  for (let i = 0; i < Math.min(10, EMBEDDING_DIMENSION); i++) {
    embedding[i] = (hash % 1000) / 1000 - 0.5;
  }
  
  // Re-normalize
  sumSquares = embedding.reduce((sum, val) => sum + val * val, 0);
  const newNorm = Math.sqrt(sumSquares);
  if (newNorm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= newNorm;
    }
  }
  
  return embedding;
}

/**
 * Generate embeddings for multiple texts
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
 */
async function generateEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Simple hash function for text
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get embedding dimension
 */
function getDimension() {
  return EMBEDDING_DIMENSION;
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  getDimension
};



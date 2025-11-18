/**
 * Document Processor - Handles document chunking and preprocessing
 */

/**
 * Chunk a document into smaller pieces
 * @param {string} text - Document text
 * @param {number} chunkSize - Target chunk size in characters
 * @param {number} overlap - Overlap between chunks in characters
 * @returns {Array<object>} Array of chunks with metadata
 */
function chunkDocument(text, chunkSize = 512, overlap = 50) {
  const chunks = [];
  
  if (!text || text.length === 0) {
    return chunks;
  }

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.substring(start, end);
    
    // Try to break at sentence boundary if possible
    let actualEnd = end;
    if (end < text.length) {
      const sentenceEnd = chunkText.lastIndexOf('.');
      const newlineEnd = chunkText.lastIndexOf('\n');
      const breakPoint = Math.max(sentenceEnd, newlineEnd);
      
      if (breakPoint > chunkSize * 0.7) { // Only break if we're at least 70% through
        actualEnd = start + breakPoint + 1;
      }
    }
    
    chunks.push({
      text: text.substring(start, actualEnd).trim(),
      start: start,
      end: actualEnd,
      index: chunkIndex++,
      length: actualEnd - start
    });
    
    // Move start position with overlap
    start = actualEnd - overlap;
    if (start < 0) start = 0;
    
    // Prevent infinite loop
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Chunk document with semantic boundaries (sentence-aware)
 * @param {string} text - Document text
 * @param {number} chunkSize - Target chunk size in characters
 * @returns {Array<object>} Array of chunks
 */
function chunkWithSemantics(text, chunkSize = 512) {
  // Split into sentences
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  
  const chunks = [];
  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        start: currentStart,
        end: currentStart + currentChunk.length,
        index: chunkIndex++,
        length: currentChunk.length
      });
      
      // Start new chunk
      currentStart = currentStart + currentChunk.length;
      currentChunk = sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      start: currentStart,
      end: currentStart + currentChunk.length,
      index: chunkIndex++,
      length: currentChunk.length
    });
  }

  return chunks;
}

/**
 * Extract metadata from text
 * @param {string} text - Document text
 * @returns {object} Extracted metadata
 */
function extractMetadata(text) {
  const metadata = {
    wordCount: text.split(/\s+/).length,
    charCount: text.length,
    lineCount: text.split('\n').length,
    hasNumbers: /\d/.test(text),
    hasUrls: /https?:\/\//.test(text),
    hasEmails: /@/.test(text)
  };

  // Try to extract title (first line or first sentence)
  const firstLine = text.split('\n')[0];
  if (firstLine.length < 100) {
    metadata.title = firstLine.trim();
  }

  return metadata;
}

module.exports = {
  chunkDocument,
  chunkWithSemantics,
  extractMetadata
};



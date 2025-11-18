// Test native modules
const path = require('path');

console.log('Testing Native Modules...\n');

// Test SLM Runtime
console.log('Testing SLM Runtime Module...');
try {
  const slmNative = require('../../src/native/slm-runtime/build/Release/slm_runtime.node');
  console.log('SLM native module loaded');

  const status = slmNative.getStatus();
  console.log('Status:', JSON.stringify(status, null, 2));

  const isLoaded = slmNative.isModelLoaded();
  console.log('Model loaded:', isLoaded);

  console.log('SLM Runtime tests passed\n');
} catch (error) {
  console.error('SLM Runtime test failed:', error.message);
  console.error('Make sure to run: npm run build:native\n');
}

// Test RAG Index
console.log('Testing RAG Index Module...');
try {
  const ragNative = require('../../src/native/rag-index/build/Release/rag_index.node');
  console.log('RAG native module loaded');

  const stats = ragNative.getStats();
  console.log('Stats:', JSON.stringify(stats, null, 2));

  // Test adding documents
  const texts = ['This is a test document.', 'Another test document.'];
  const embeddings = [
    new Array(384).fill(0).map(() => Math.random()),
    new Array(384).fill(0).map(() => Math.random())
  ];
  
  const addResult = ragNative.addDocuments(texts, embeddings);
  console.log('Add documents result:', JSON.stringify(addResult, null, 2));

  // Test search
  const queryEmbedding = new Array(384).fill(0).map(() => Math.random());
  const searchResults = ragNative.search(queryEmbedding, 2);
  console.log('Search results count:', searchResults.length);

  // Test clear
  const clearResult = ragNative.clear();
  console.log('Clear result:', JSON.stringify(clearResult, null, 2));

  console.log('RAG Index tests passed\n');
} catch (error) {
  console.error('RAG Index test failed:', error.message);
  console.error('Make sure to run: npm run build:native\n');
}

console.log('Native module tests completed!');


/**
 * Test service layer
 * Run with: node test/unit/services-test.js
 */

console.log('🧪 Testing Service Layer...\n');

// Test SLM Service
console.log('📦 Testing SLM Service...');
try {
  const slmService = require('../../src/services/slm-service');
  
  const modelInfo = slmService.getModelInfo();
  console.log('   Model info:', JSON.stringify(modelInfo, null, 2));

  // Test inference (will use mock if model not loaded)
  slmService.infer('What is AI?', { max_tokens: 10 })
    .then(result => {
      console.log('   Inference result:', JSON.stringify(result, null, 2));
      console.log('✅ SLM Service tests passed\n');
    })
    .catch(error => {
      console.error('❌ SLM Service inference failed:', error.message);
    });
} catch (error) {
  console.error('❌ SLM Service test failed:', error.message);
}

// Test RAG Service
console.log('📦 Testing RAG Service...');
try {
  const ragService = require('../../src/services/rag-service');
  
  const stats = ragService.getIndexStats();
  console.log('   Index stats:', JSON.stringify(stats, null, 2));

  // Test search (will use mock if no documents indexed)
  ragService.search('What is RAG?', 3)
    .then(results => {
      console.log('   Search results:', JSON.stringify(results, null, 2));
      console.log('✅ RAG Service tests passed\n');
    })
    .catch(error => {
      console.error('❌ RAG Service search failed:', error.message);
    });
} catch (error) {
  console.error('❌ RAG Service test failed:', error.message);
}

// Test Embedding Service
console.log('📦 Testing Embedding Service...');
try {
  const embeddingService = require('../../src/services/embedding-service');
  
  embeddingService.generateEmbedding('Test text')
    .then(embedding => {
      console.log('   Embedding dimension:', embedding.length);
      console.log('   Embedding sample:', embedding.slice(0, 5));
      console.log('✅ Embedding Service tests passed\n');
    })
    .catch(error => {
      console.error('❌ Embedding Service test failed:', error.message);
    });
} catch (error) {
  console.error('❌ Embedding Service test failed:', error.message);
}

console.log('🎉 Service layer tests completed!');


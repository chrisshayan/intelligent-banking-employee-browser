/**
 * Integration test for API endpoints
 * Run with: node test/integration/api-test.js
 */

const http2 = require('http2');
const https = require('https');
const fs = require('fs');

const API_URL = 'https://localhost:8443';
const API_BASE = '/api/v1';

// Disable SSL verification for localhost self-signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Make HTTP/2 request
 */
function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const client = http2.connect(API_URL, {
      rejectUnauthorized: false
    });

    client.on('error', (err) => reject(err));

    const headers = {
      ':method': method,
      ':path': path,
      ':scheme': 'https',
      ':authority': 'localhost:8443',
      'content-type': 'application/json'
    };

    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }

    if (body) {
      headers['content-length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = client.request(headers);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();

    let responseData = '';
    req.on('response', (headers) => {
      req.on('data', (chunk) => {
        responseData += chunk;
      });

      req.on('end', () => {
        client.close();
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: headers[':status'],
            headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: headers[':status'],
            headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });
  });
}

/**
 * Test health endpoint
 */
async function testHealth() {
  console.log('\n📋 Testing Health Endpoint...');
  try {
    const response = await makeRequest('/health');
    console.log('✅ Health check:', response.status);
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return response.status === '200';
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

/**
 * Test inference endpoint (will fail without proper auth, but tests endpoint exists)
 */
async function testInference() {
  console.log('\n📋 Testing Inference Endpoint...');
  try {
    const response = await makeRequest(
      `${API_BASE}/inference`,
      'POST',
      {
        prompt: 'What is AI?',
        max_tokens: 50
      },
      'test-token' // Mock token
    );
    console.log('   Status:', response.status);
    if (response.status === '200' || response.status === '401') {
      console.log('✅ Inference endpoint accessible');
      return true;
    }
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return false;
  } catch (error) {
    console.error('❌ Inference test failed:', error.message);
    return false;
  }
}

/**
 * Test RAG endpoint
 */
async function testRAG() {
  console.log('\n📋 Testing RAG Endpoint...');
  try {
    const response = await makeRequest(
      `${API_BASE}/rag`,
      'POST',
      {
        query: 'What is RAG?',
        top_k: 3
      },
      'test-token' // Mock token
    );
    console.log('   Status:', response.status);
    if (response.status === '200' || response.status === '401') {
      console.log('✅ RAG endpoint accessible');
      return true;
    }
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return false;
  } catch (error) {
    console.error('❌ RAG test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting API Integration Tests...');
  console.log('   API URL:', API_URL);
  console.log('   Note: These tests require the API server to be running');
  console.log('   Start the server with: npm start (in another terminal)');

  const results = {
    health: false,
    inference: false,
    rag: false
  };

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.health = await testHealth();
  results.inference = await testInference();
  results.rag = await testRAG();

  console.log('\n📊 Test Results:');
  console.log('   Health:', results.health ? '✅' : '❌');
  console.log('   Inference:', results.inference ? '✅' : '❌');
  console.log('   RAG:', results.rag ? '✅' : '❌');

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '✅ All tests passed!' : '⚠️  Some tests failed'));
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


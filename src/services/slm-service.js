const config = require('../utils/config');
const path = require('path');

// Load native module if available
let slmNative = null;
try {
  slmNative = require('../native/slm-runtime/build/Release/slm_runtime.node');
  console.log('SLM native module loaded');
} catch (error) {
  console.warn('SLM native module not available, using mock:', error.message);
}

let modelLoaded = false;

/**
 * Load the SLM model
 */
async function loadModel() {
  if (!slmNative) {
    console.warn('Native module not available, cannot load model');
    return false;
  }

  const modelPath = config.get('slm.modelPath');
  if (!modelPath) {
    console.error('Model path not configured');
    return false;
  }

  try {
    // Resolve relative paths
    const resolvedPath = path.isAbsolute(modelPath) 
      ? modelPath 
      : path.resolve(__dirname, '../../', modelPath);

    const result = slmNative.loadModel(resolvedPath);
    modelLoaded = result;
    
    if (modelLoaded) {
      console.log('SLM model loaded:', resolvedPath);
    } else {
      console.error('Failed to load SLM model');
    }
    
    return modelLoaded;
  } catch (error) {
    console.error('Error loading model:', error);
    modelLoaded = false;
    return false;
  }
}

/**
 * Perform inference using the local SLM
 * @param {string} prompt - The prompt to send to the SLM
 * @param {object} options - Inference options
 * @returns {Promise<object>} Inference result
 */
async function infer(prompt, options = {}) {
  // If native module is available and model is loaded, use it
  if (slmNative && modelLoaded) {
    try {
      const result = slmNative.infer(prompt);
      return {
        text: result.text,
        tokens_generated: result.tokens_generated || 0,
        confidence: result.confidence || 0.0
      };
    } catch (error) {
      console.error('Native inference error:', error);
      // Fall through to mock
    }
  }

  // Fallback to mock if native module not available or model not loaded
  console.log('SLM Service: Using mock inference (native module:', !!slmNative, ', model loaded:', modelLoaded, ')');
  
  // Simulate inference delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock response
  return {
    text: `[Mock Response] This is a placeholder response for: "${prompt.substring(0, 50)}..."\n\nThe native module is ${slmNative ? 'available' : 'not available'} and model is ${modelLoaded ? 'loaded' : 'not loaded'}.`,
    tokens_generated: Math.floor(Math.random() * 50) + 10,
    confidence: 0.85
  };
}

/**
 * Perform batch inference
 * @param {Array<string>} prompts - Array of prompts
 * @param {object} options - Inference options
 * @returns {Promise<Array<object>>} Array of inference results
 */
async function inferBatch(prompts, options = {}) {
  const results = [];
  for (const prompt of prompts) {
    const result = await infer(prompt, options);
    results.push(result);
  }
  return results;
}

/**
 * Get model information
 * @returns {object} Model information
 */
function getModelInfo() {
  if (slmNative) {
    try {
      const status = slmNative.getStatus();
      return {
        name: 'phi4-mini',
        version: '1.0.0',
        status: status.loaded ? 'loaded' : 'not_loaded',
        path: status.modelPath || config.get('slm.modelPath'),
        backend: status.backend || 'unknown'
      };
    } catch (error) {
      console.error('Error getting model status:', error);
    }
  }

  return {
    name: 'phi4-mini',
    version: '1.0.0',
    status: 'not_loaded',
    path: config.get('slm.modelPath'),
    backend: 'mock'
  };
}

// Auto-load model on module initialization (if path is configured)
if (slmNative) {
  const modelPath = config.get('slm.modelPath');
  if (modelPath) {
    // Try to load, but don't block if it fails
    loadModel().catch(err => {
      console.warn('Auto-load model failed:', err.message);
    });
  }
}

module.exports = {
  loadModel,
  infer,
  inferBatch,
  getModelInfo
};

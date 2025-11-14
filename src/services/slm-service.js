const fs = require('fs');
const path = require('path');
const config = require('../utils/config');

let slmNative = null;
let nativeInitialized = false;
let nativeAvailable = false;
let nativeLoadError = null;
let nativeModelLoaded = false;
let resolvedModelPath = null;

function resolveNativeModule() {
  if (nativeInitialized) {
    return nativeAvailable;
  }

  nativeInitialized = true;

  const candidatePaths = [
    path.join(__dirname, '../native/slm-runtime/build/Release/slm_runtime.node'),
    path.join(__dirname, '../native/slm-runtime/build/Debug/slm_runtime.node')
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        slmNative = require(candidate);
        nativeAvailable = true;
        console.log('[SLM] Native module loaded:', candidate);
        break;
      } catch (error) {
        nativeLoadError = error;
      }
    }
  }

  if (!nativeAvailable) {
    nativeLoadError = nativeLoadError || new Error('Native module not found');
    console.warn('[SLM] Native module unavailable:', nativeLoadError.message);
  } else {
    tryLoadModel();
  }

  return nativeAvailable;
}

function tryLoadModel() {
  if (!slmNative) {
    return;
  }

  const modelPath = config.get('slm.modelPath');
  if (!modelPath) {
    console.warn('[SLM] No model path configured');
    return;
  }

  resolvedModelPath = path.isAbsolute(modelPath)
    ? modelPath
    : path.resolve(process.cwd(), modelPath);

  if (!fs.existsSync(resolvedModelPath)) {
    console.warn('[SLM] Model file not found:', resolvedModelPath);
    return;
  }

  try {
    const loaded = slmNative.loadModel(resolvedModelPath);
    nativeModelLoaded = Boolean(loaded);
    console.log('[SLM] Model loaded:', resolvedModelPath);
  } catch (error) {
    nativeModelLoaded = false;
    console.error('[SLM] Failed to load model:', error.message);
  }
}

/**
 * Perform inference using the local SLM
 * @param {string} prompt - The prompt to send to the SLM
 * @param {object} options - Inference options
 * @returns {Promise<object>} Inference result
 */
async function infer(prompt, options = {}) {
  if (resolveNativeModule() && nativeModelLoaded) {
    try {
      const result = slmNative.infer(prompt, options);
      return {
        text: result.text || '',
        tokens_generated: result.tokens_generated || 0,
        confidence: result.confidence || 0,
        backend: 'native'
      };
    } catch (error) {
      console.error('[SLM] Native inference failed, falling back to mock:', error.message);
    }
  }

  console.log('SLM Service: Using mock inference backend', { prompt: prompt.substring(0, 50) + '...' });

  // Simulate inference delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock response
  return {
    text: `[Mock Response] This is a placeholder response for: "${prompt.substring(0, 50)}..."\n\nThe native SLM module will be used automatically once it is built and a model is available.`,
    tokens_generated: Math.floor(Math.random() * 50) + 10,
    confidence: 0.85,
    backend: nativeAvailable ? 'native (model missing)' : 'mock'
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
  resolveNativeModule();
  return {
    name: 'phi4-mini',
    version: '1.0.0',
    status: nativeModelLoaded ? 'loaded' : (nativeAvailable ? 'model_not_found' : 'native_unavailable'),
    path: resolvedModelPath || config.get('slm.modelPath'),
    nativeAvailable,
    nativeLoadError: nativeLoadError ? nativeLoadError.message : null
  };
}

module.exports = {
  infer,
  inferBatch,
  getModelInfo
};


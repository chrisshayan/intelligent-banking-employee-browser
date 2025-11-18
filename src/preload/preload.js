const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - runs in isolated context before page scripts
 * This is the secure bridge between the renderer process and main process
 */

// Expose protected methods that allow the renderer process to use
// the API without exposing the entire Electron API
contextBridge.exposeInMainWorld('smartCoach', {
  /**
   * Get API version and status
   */
  getVersion: () => {
    return '1.0.0';
  },

  /**
   * Check if API is ready
   */
  isReady: () => {
    return true;
  },

  /**
   * Query the local SLM
   * @param {string} prompt - The prompt to send to the SLM
   * @param {object} options - Query options (max_tokens, temperature, etc.)
   * @returns {Promise<object>} Inference result
   */
  query: async (prompt, options = {}) => {
    try {
      // Request session token via secure IPC
      const token = await ipcRenderer.invoke('get-session-token', {
        origin: window.location.origin
      });

      // Make API call to localhost server
      const response = await fetch('https://localhost:8443/api/v1/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, ...options })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.query error:', error);
      throw error;
    }
  },

  /**
   * Search the RAG index
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Promise<object>} Search results
   */
  search: async (query, topK = 5) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, top_k: topK })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.search error:', error);
      throw error;
    }
  },

  /**
   * Escalate query to cloud LLM (with user consent)
   * @param {string} prompt - The prompt to escalate
   * @param {object} context - Additional context
   * @returns {Promise<object>} Cloud inference result
   */
  escalate: async (prompt, context = {}) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, context, user_consent: true })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.escalate error:', error);
      throw error;
    }
  },

  /**
   * Smart Coach - Ask a question and get instant answers
   * @param {string} question - The question to ask
   * @param {object} context - Additional context (role, page, etc.)
   * @returns {Promise<object>} Answer with sources
   */
  ask: async (question, context = {}) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      const currentOrigin = window.location.origin || window.location.href;
      
      const response = await fetch('https://localhost:8443/api/v1/smart-coach/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Origin': currentOrigin,
          'Origin': currentOrigin
        },
        body: JSON.stringify({ question, context }),
        // Ignore SSL certificate errors for localhost
        // Electron should handle this via command line switches
      }).catch(err => {
        // Better error handling
        console.error('Fetch error:', err);
        throw new Error(`Network error: ${err.message}. Make sure the API server is running.`);
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.ask error:', error);
      throw error;
    }
  },

  /**
   * Email Assistant - Generate email drafts
   * @param {object} params - Email generation parameters
   * @param {string} params.clientName - Client name
   * @param {string} params.purpose - Purpose of email
   * @param {object} params.context - Additional context
   * @param {string} params.tone - Email tone
   * @param {number} params.variations - Number of variations (optional)
   * @returns {Promise<object>} Generated email draft(s)
   */
  generateEmail: async (params) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/email-assistant/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.generateEmail error:', error);
      throw error;
    }
  },

  /**
   * Campaign Generator - Generate marketing campaign content
   * @param {object} params - Campaign generation parameters
   * @param {string} params.campaignName - Campaign name
   * @param {string} params.objective - Campaign objective
   * @param {string} params.targetAudience - Target audience
   * @param {Array<string>} params.channels - Channels (['email', 'sms', 'push'])
   * @param {object} params.productInfo - Product information
   * @param {object} params.brandGuidelines - Brand guidelines
   * @param {boolean} params.generateVariations - Generate A/B variations
   * @returns {Promise<object>} Generated campaign content
   */
  generateCampaign: async (params) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/campaign/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.generateCampaign error:', error);
      throw error;
    }
  },

  /**
   * Product Advisor - Get product recommendations for a client
   * @param {object} clientData - Client profile data
   * @param {string} clientData.clientId - Client identifier
   * @param {object} clientData.profile - Client profile
   * @param {object} options - Recommendation options
   * @returns {Promise<object>} Product recommendations
   */
  recommendProducts: async (clientData, options = {}) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/product-advisor/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientData, options })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.recommendProducts error:', error);
      throw error;
    }
  },

  /**
   * Compliance Checker - Check content for compliance
   * @param {object} params - Compliance check parameters
   * @param {string} params.content - Content to check
   * @param {string} params.contentType - Type of content
   * @param {object} params.context - Additional context
   * @param {Array<string>} params.regulations - Specific regulations to check
   * @returns {Promise<object>} Compliance check results
   */
  checkCompliance: async (params) => {
    try {
      const token = await ipcRenderer.invoke('get-session-token');
      
      const response = await fetch('https://localhost:8443/api/v1/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('smartCoach.checkCompliance error:', error);
      throw error;
    }
  }
});

// Log that preload script has loaded
console.log('Smart Coach API loaded');


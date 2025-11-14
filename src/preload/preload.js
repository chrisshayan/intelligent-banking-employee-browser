const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - runs in isolated context before page scripts
 * This is the secure bridge between the renderer process and main process
 */

// Expose protected methods that allow the renderer process to use
// the API without exposing the entire Electron API
contextBridge.exposeInMainWorld('backbaseAI', {
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
      console.error('backbaseAI.query error:', error);
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
      console.error('backbaseAI.search error:', error);
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
      console.error('backbaseAI.escalate error:', error);
      throw error;
    }
  }
});

// Log that preload script has loaded
console.log('Backbase AI Bridge loaded');


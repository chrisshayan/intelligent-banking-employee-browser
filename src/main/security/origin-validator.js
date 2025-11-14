const config = require('../../utils/config');

// Default allowed origins (can be overridden by config)
const DEFAULT_ALLOWED_ORIGINS = [
  /^https:\/\/.*\.backbase\.com$/,
  /^https:\/\/.*\.backbase\.io$/,
  /^https:\/\/localhost:\d+$/, // Allow localhost for development
  /^https:\/\/127\.0\.0\.1:\d+$/ // Allow 127.0.0.1 for development
];

let allowedOrigins = null;

/**
 * Load allowed origins from configuration
 */
function loadAllowedOrigins() {
  if (allowedOrigins !== null) {
    return allowedOrigins;
  }

  try {
    const configOrigins = config.get('security.allowedOrigins', []);
    allowedOrigins = configOrigins.map(pattern => {
      // Convert string patterns to RegExp
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Already a regex pattern
        const regexStr = pattern.slice(1, -1);
        return new RegExp(regexStr);
      }
      // Simple string match (convert to regex)
      return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    });

    // Add default origins if config is empty
    if (allowedOrigins.length === 0) {
      allowedOrigins = DEFAULT_ALLOWED_ORIGINS;
    }
  } catch (error) {
    console.error('Error loading allowed origins:', error);
    allowedOrigins = DEFAULT_ALLOWED_ORIGINS;
  }

  return allowedOrigins;
}

/**
 * Validate if an origin is allowed
 * @param {string} origin - The origin to validate (URL or origin string)
 * @returns {boolean} True if origin is allowed
 */
function validateOrigin(origin) {
  if (!origin) {
    return false;
  }

  try {
    // Extract origin from URL if full URL is provided
    let originString = origin;
    try {
      const url = new URL(origin);
      originString = url.origin;
    } catch {
      // If it's already an origin string, use it as-is
      originString = origin;
    }

    const patterns = loadAllowedOrigins();
    
    // Check if origin matches any allowed pattern
    const isAllowed = patterns.some(pattern => pattern.test(originString));
    
    if (!isAllowed) {
      console.warn('Origin validation failed:', originString);
    }
    
    return isAllowed;
  } catch (error) {
    console.error('Error validating origin:', error);
    return false;
  }
}

/**
 * Get list of allowed origin patterns
 * @returns {Array<RegExp>} Array of allowed origin patterns
 */
function getAllowedOrigins() {
  return loadAllowedOrigins();
}

module.exports = {
  validateOrigin,
  getAllowedOrigins
};


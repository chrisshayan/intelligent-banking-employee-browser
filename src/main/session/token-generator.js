const crypto = require('crypto');

/**
 * Generate a secure random session token
 * @returns {string} Base64-encoded token
 */
function generateToken() {
  // Generate 32 random bytes and encode as base64
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64');
}

/**
 * Generate a token with custom length
 * @param {number} bytes - Number of random bytes
 * @returns {string} Base64-encoded token
 */
function generateTokenWithLength(bytes = 32) {
  const randomBytes = crypto.randomBytes(bytes);
  return randomBytes.toString('base64');
}

module.exports = {
  generateToken,
  generateTokenWithLength
};


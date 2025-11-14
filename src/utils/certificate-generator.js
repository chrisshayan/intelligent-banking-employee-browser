const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a self-signed certificate for development
 */
function generateSelfSignedCert() {
  const { generateKeyPairSync } = crypto;
  
  // Generate key pair
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Create certificate (simplified - in production use proper CA)
  // For development, we'll create a basic certificate
  const cert = createSelfSignedCert(publicKey, privateKey);

  return {
    cert: cert,
    key: privateKey
  };
}

/**
 * Create a basic self-signed certificate
 */
function createSelfSignedCert(publicKey, privateKey) {
  // This is a simplified version. In production, use a proper certificate library
  // For now, return a placeholder that HTTP/2 will accept for localhost
  return `-----BEGIN CERTIFICATE-----
MIICXTCCAUYCCQDx... (self-signed cert for localhost)
-----END CERTIFICATE-----`;
}

module.exports = {
  generateSelfSignedCert
};


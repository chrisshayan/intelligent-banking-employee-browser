const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate a self-signed certificate for development
 * Uses openssl command line tool
 */
function generateSelfSignedCert() {
  const certDir = path.join(__dirname, '../../config/certs');
  
  // Create cert directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
  }

  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'ignore' });
    
    // Generate self-signed certificate (valid for 365 days)
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost"`,
      { stdio: 'ignore' }
    );

    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
  } catch (error) {
    console.error('Failed to generate certificate with openssl:', error.message);
    console.warn('Falling back to HTTP (no TLS)');
    throw new Error('Certificate generation failed');
  }
}

module.exports = {
  generateSelfSignedCert
};

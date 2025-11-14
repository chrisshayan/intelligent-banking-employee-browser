const config = require('../../utils/config');
const crypto = require('crypto');

// Default certificate pins (should be configured per environment)
const DEFAULT_PINS = [];

/**
 * Calculate certificate fingerprint
 * @param {Buffer} certData - Certificate data
 * @returns {string} SHA-256 fingerprint
 */
function calculateFingerprint(certData) {
  return crypto
    .createHash('sha256')
    .update(certData)
    .digest('base64');
}

/**
 * Setup certificate pinning for Backbase domains
 */
function setupCertificatePinning() {
  const pins = config.get('security.certificatePinning.pins', DEFAULT_PINS);
  const enabled = config.get('security.certificatePinning.enabled', false);

  if (!enabled || pins.length === 0) {
    console.log('Certificate pinning disabled or no pins configured');
    return;
  }

  require('electron').session.defaultSession.setCertificateVerifyProc(
    (request, callback) => {
      const { hostname, certificate } = request;

      // Only pin Backbase domains
      if (hostname.endsWith('.backbase.com') || hostname.endsWith('.backbase.io')) {
        try {
          // Calculate certificate fingerprint
          const fingerprint = calculateFingerprint(certificate.data);

          // Check if fingerprint matches any pinned certificate
          const isValid = pins.some(pin => {
            // Support both 'sha256/...' format and raw base64
            const pinValue = pin.startsWith('sha256/') ? pin.slice(7) : pin;
            return fingerprint === pinValue;
          });

          if (isValid) {
            callback(0); // Success
          } else {
            console.error('Certificate pinning failed for:', hostname);
            callback(-2); // Failure
          }
        } catch (error) {
          console.error('Certificate pinning error:', error);
          callback(-2); // Failure on error
        }
      } else {
        // Use default verification for other domains
        callback(0);
      }
    }
  );

  console.log('Certificate pinning enabled for', pins.length, 'pins');
}

module.exports = {
  setupCertificatePinning,
  calculateFingerprint
};


const jsonwebtoken = require('jsonwebtoken');

class JWT {
  /**
   * Decode a JWT without verifying signature
   * @param {string} token JWT token string
   * @returns {object} Decoded JWT payload
   */
  decode(token) {
    return jsonwebtoken.decode(token, { complete: true });
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token JWT token string
   * @param {string} secret Secret key for verification
   * @param {object} options JWT verify options
   * @returns {object} Decoded JWT if valid
   */
  verify(token, secret, options = {}) {
    try {
      return jsonwebtoken.verify(token, secret, options);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { error };
    }
  }

  /**
   * Generate a new JWT token
   * @param {object} payload Data to encode in the token
   * @param {string} secret Secret key for signing
   * @param {object} options JWT sign options
   * @returns {string} Signed JWT token
   */
  generate(payload, secret, options = {}) {
    return jsonwebtoken.sign(payload, secret, options);
  }

  /**
   * Analyze token structure and details
   * @param {string} token JWT token string
   * @returns {object} Analysis results
   */
  analyze(token) {
    try {
      const decoded = this.decode(token);
      if (!decoded) return { error: 'Invalid token format' };

      const parts = token.split('.');
      const analysis = {
        structure: {
          header: decoded.header,
          payload: decoded.payload,
          signature: parts[2] ? true : false
        },
        validation: {
          hasExpiry: decoded.payload.exp ? true : false,
          hasIssuedAt: decoded.payload.iat ? true : false,
          hasNotBefore: decoded.payload.nbf ? true : false,
        }
      };

      // Check expiration
      if (analysis.validation.hasExpiry) {
        const expiry = new Date(decoded.payload.exp * 1000);
        const now = new Date();
        analysis.validation.isExpired = now > expiry;
        analysis.validation.expiresIn = analysis.validation.isExpired ? 
          'Expired' : 
          this.formatTimeRemaining(expiry.getTime() - now.getTime());
      }

      // Check algorithm security
      if (decoded.header.alg) {
        analysis.security = {
          algorithm: decoded.header.alg,
          isSecure: decoded.header.alg !== 'none' && !decoded.header.alg.startsWith('HS')
        };
      }

      return analysis;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { error };
    }
  }

  /**
   * Format milliseconds to human readable time
   * @param {number} ms Milliseconds
   * @returns {string} Formatted time string
   */
  formatTimeRemaining(ms) {
    if (ms <= 0) return 'Expired';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
  }
}

module.exports = new JWT(); 
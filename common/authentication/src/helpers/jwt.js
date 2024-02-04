const context = require('@clabroche/common-context');
const jsonwebtoken = require('jsonwebtoken');

module.exports = {
  /** @param {JWT} jwt */
  setJwt(jwt) {
    context.setItem('addworking-jwt', jwt);
  },

  /** @return {JWT} */
  getJwt() {
    return context.getItem('addworking-jwt');
  },

  /** @return {JWT | undefined} */
  verify(token) {
    if (!process.env.JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY env not present');
    try {
      return /** @type {JWT} */(jsonwebtoken.verify(token, process.env.JWT_PRIVATE_KEY));
    } catch {
      return undefined;
    }
  },
  /**
   * @param {Partial<JWT>} payload
   * @param {import('jsonwebtoken').SignOptions} option
   */
  sign(payload, option = {}) {
    if (!process.env.JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY env not present');
    return jsonwebtoken.sign(payload, process.env.JWT_PRIVATE_KEY, option);
  },
  /** @return {Object} */
  decode(token) {
    return jsonwebtoken.decode(token);
  },

  /** @param {string} authorization */
  parseAuthorization(authorization) {
    const authHeader = authorization;
    if (authHeader === process.env.JWT_PRIVATE_KEY) {
      const jwt = { isAdmin: true };
      module.exports.setJwt(jwt);
      return jwt;
    }
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const jwt = module.exports.verify(token);
      if (jwt) {
        module.exports.setJwt(jwt);
        return jwt;
      }
    }
    return null;
  },
};

/**
 * @typedef {{
*  isAdmin?: boolean,
*  userId?: string,
*  email?: string,
* }} JWT
*/

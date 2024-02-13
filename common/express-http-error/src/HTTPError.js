const dayjs = require('dayjs');
const { v4: uuid } = require('uuid');

const statusMessage = {
  403: 'Not allowed',
  404: 'Resource not found',
  500: 'We cannot respond to your request for moment. Contact support for more information',
};
module.exports.statusMessage = statusMessage;

class HTTPError extends Error {
  /**
   *
   * @param {string} message
   * @param {number} code
   * @param {string} errorId
   * @param {string} date
   * @param {string} stack
   */
  constructor(
    message,
    code = 500,
    errorId = uuid(),
    date = dayjs().format('YYYY-MM-DD HH:mm:ss'),
    stack = '',
  ) {
    super(message);
    this.code = code || 500;
    this.errorId = errorId;
    this.date = date;
    this.message = process.env.NODE_ENV === 'production'
      ? statusMessage[this.code] || message?.toString() || message
      : message?.toString() || message || statusMessage[this.code];
    this.originalMessage = message;
    this.originalStack = stack || new Error().stack;
  }
}

module.exports = HTTPError;

const sqlFormatter = require('sql-formatter');

/**
 * @typedef {import('sql-formatter').FormatOptionsWithLanguage} FormatOptions
 */

/**
 * @typedef {Object} BeautifyResult
 * @property {string} result - The beautified SQL query
 */

/**
 * @typedef {Object} BeautifyError
 * @property {string} error - The error message
 */

class SQLBeautifier {
  /**
   * Beautify SQL query
   * @param {string} sql - The SQL query to beautify
   * @returns {BeautifyResult} The beautified SQL query
   * @throws {Error} If the SQL query is invalid or formatting fails
   */
  beautify(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL query must be a non-empty string');
    }

    try {
      const formattedSQL = sqlFormatter.format(sql);
      return {
        result: formattedSQL
      };
    } catch (/** @type {unknown} */ error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to beautify SQL: ${errorMessage}`);
    }
  }
}

module.exports = new SQLBeautifier(); 
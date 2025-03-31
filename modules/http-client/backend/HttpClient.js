const axios = require('axios').default;

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HttpClient = (stackMonitor) => ({
  /**
   * Send HTTP request
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} options.url - Request URL
   * @param {Object} [options.headers] - Request headers
   * @param {Object|string} [options.body] - Request body
   * @param {Object} [options.params] - Query parameters
   * @returns {Promise<Object>} Response data
   */
  sendRequest: async ({ method, url, headers = {}, body = null, params = {} }) => {
    try {
      const config = {
        method,
        url,
        headers,
        params,
      };

      if (body) {
        config.data = body;
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: endTime - startTime,
      };
    } catch (error) {
      // Handle axios error responses
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = /** @type {import('axios').AxiosError} */ (error);
        return {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          headers: axiosError.response?.headers,
          data: axiosError.response?.data,
          error: true,
        };
      }
      throw error;
    }
  },
});

module.exports = HttpClient; 
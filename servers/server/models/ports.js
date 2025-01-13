module.exports = {
  http: process.env.STACK_MONITOR_HTTP_PORT || 0,
  /** @param {number} port */
  setHttpPort(port) {
    if (!this.http) this.http = port;
  },
};

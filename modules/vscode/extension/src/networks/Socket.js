const io = require('socket.io-client');

const Socket = {
  /**
   *
   * @param {*} url
   * @param {*} id
   * @param {*} path
   * @param {*} auth
   * @returns {Promise<import('socket.io-client').Socket>}
   */
  init(url, id, path, auth) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const socket = io(url, { path });
      this.socket = socket;
      socket.on('connect', () => socket.emit('socket:register', id, auth, (response) => {
        if (response.result === 'ok') {
          resolve(socket);
        } else {
          reject(response.error);
        }
      }));
    });
  },
};

module.exports = {
  async init(baseUrl) {
    this.socket = await Socket.init(baseUrl, 'stack-monitor', '/socket.io', () => true);
  },
};

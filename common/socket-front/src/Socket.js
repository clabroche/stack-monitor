import io from 'socket.io-client';

export default {
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

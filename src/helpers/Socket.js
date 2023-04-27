import config from './config';
import io from 'socket.io-client'

export default {
  /** @type {import('socket.io-client').Socket} */
  // @ts-ignore
  socket: null,
  init() {
    return new Promise(resolve => {
      this.socket = io(config.baseURL)
      this.socket.on('connect', function () {
        resolve(true);
      });
    })
  },
}

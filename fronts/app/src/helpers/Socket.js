import { Socket } from '@clabroche/common-socket-front';
import config from './config';

export default {
  /** @type {Awaited<Socket>} */
  // @ts-ignore
  socket: null,
  async init() {
    await Socket.init(config.baseURL);
    this.socket = Socket;
  },
  on(...args) {
    this.socket.on(...args);
  },
  off(...args) {
    this.socket.off(...args);
  },
};

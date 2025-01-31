import { Socket } from '@clabroche/common-socket-front';

export default {
  /** @type {Awaited<Socket>} */
  // @ts-ignore
  socket: null,
  async init(url) {
    await Socket.init(url);
    this.socket = Socket;
  },
  on(...args) {
    this.socket.on(...args);
  },
  off(...args) {
    this.socket.off(...args);
  },
  emit(...args) {
    this.socket.emit(...args);
  },
};

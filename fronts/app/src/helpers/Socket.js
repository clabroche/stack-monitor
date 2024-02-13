import { Socket } from '@clabroche/common-socket-front';
import config from './config';

export default {
  async init() {
    this.socket = await Socket.init(config.baseURL, 'stack-monitor', '/socket.io', () => true);
  },
};

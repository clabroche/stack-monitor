const WebSocket = require('ws');
const CustomObservable = require('./CustomObservable');

/** @type {Record<string, CustomObservable>} */
const events = {};

module.exports = {
  /** @type {WebSocket.Server | null} */
  io: null,
  emit(channel, ...data) {
    this.io?.clients.forEach((ws) => {
      ws.send(JSON.stringify({ channel, data }));
    });
  },
  on: (event, cb) => {
    if (!events[event]) events[event] = new CustomObservable();
    events[event].subscribe(cb);
  },
  /**
   *
   * @param {*} server
   */
  connect(server) {
    this.io = new WebSocket.Server({ server, path: '/socket' });
  },
};

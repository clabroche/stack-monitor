const WebSocket = require('ws');
const CustomObservable = require('./CustomObservable');

/** @type {Record<string, CustomObservable>} */
const events = {};

module.exports = {
  /** @type {WebSocket.Server | null} */
  io: null,
  emit(channel, ...data) {
    events[channel]?.next(...data)
    this.io?.clients.forEach((ws) => {
      ws.send(JSON.stringify({ channel, data }));
    });
  },
  on: (event, cb) => {
    if (!events[event]) events[event] = new CustomObservable();
    events[event].subscribe(cb);
  },
  off(event, cb) {
    events[event]?.off(cb)
  },
  /**
   *
   * @param {*} server
   */
  connect(server) {
    this.io = new WebSocket.Server({ noServer: true, path: '/socket' });
    this.io.on('connection', function message(ws) {
      ws.on('message', function message(event) {
        const { channel, data } = JSON.parse(event?.toString());
        events[channel]?.next(...data)
      })
    })
    const self = this
    server.on('upgrade', function upgrade(request, socket, head) {
      if (request.url === '/socket') {
        self.io?.handleUpgrade(request, socket, head, function done(ws) {
          self.io?.emit('connection', ws, request);
        });
      }
    });
  },
};

const { Server } = require('socket.io');
const CustomObservable = require('./CustomObservable');

/** @type {Record<string, CustomObservable>} */
const events = {};

module.exports = {
  /** @type {Server | null} */
  io: null,
  emit(room, channel, ...data) {
    if (this.io) {
      this.io.to(room).emit(channel, ...data);
    }
  },
  on: (event, cb) => {
    if (!events[event]) events[event] = new CustomObservable();
    events[event].subscribe(cb);
  },
  /**
   *
   * @param {*} server
   * @param {*} origin
   * @param {*} path
   * @param {AcknowlegementCB} authCallback
   */
  connect(server, origin, path = '/', authCallback = async () => true) {
    this.io = new Server(server, {
      path,
      cors: {
        origin,
        methods: ['GET', 'POST'],
      },
    });
    this.io.on('connection', (_socket) => {
      _socket.onAny((event, ...data) => {
        events[event]?.next(_socket, ...data);
      });
    });
    this.io.on('connect', (socket) => {
      socket.on('socket:register', async (id, auth, callback) => {
        try {
          if (await authCallback(auth, id)) {
            socket.join(id);
            callback({ result: 'ok' });
          } else {
            callback({ result: 'ko', error: { message: 'no auth' } });
          }
        } catch (error) {
          callback({ result: 'ko', error: { message: error?.message || error } });
          console.error(error);
        }
      });
      socket.on('disconnect', () => {
      });
    });
  },
};
/**
 * @typedef {(auth:string, id:string) => Promise <boolean>} AcknowlegementCB
 */

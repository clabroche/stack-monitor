const { Server } = require('socket.io');

module.exports = {
  /** @type {Server | null} */
  io: null,
  emit(room, channel, ...data) {
    if (this.io) {
      this.io.to(room).emit(channel, ...data);
    }
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

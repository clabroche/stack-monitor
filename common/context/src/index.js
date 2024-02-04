const { v4 } = require('uuid');
const { AsyncLocalStorage } = require('node:async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

module.exports = {
  init(req, res, next) {
    asyncLocalStorage.run(new Map(), () => {
      if (req) module.exports.setItem('req', req);
      if (res) module.exports.setItem('res', res);
      module.exports.setItem('context-init', true);
      module.exports.setItem('id', v4());
      module.exports.setItem('isExpress', true);
      if (typeof req === 'function') req();
      if (typeof next === 'function') next();
    });
  },
  initWithoutExpress(next) {
    asyncLocalStorage.run(new Map(), () => {
      module.exports.setItem('context-init', true);
      module.exports.setItem('id', v4());
      module.exports.setItem('isExpress', false);
      next();
    });
  },
  isInited: () => !!asyncLocalStorage.getStore(),
  getItem(key) {
    /** @type {Map} */
    const context = asyncLocalStorage.getStore();
    if (!context) throw new Error('Context seems to not be init. Call init before');
    return context.get(key);
  },
  setItem(key, value) {
    /** @type {Map} */
    const context = asyncLocalStorage.getStore();
    if (!context) throw new Error('Context seems to not be init. Call init before');
    return context.set(key, value);
  },
  removeItem(key) {
    /** @type {Map} */
    const context = asyncLocalStorage.getStore();
    if (!context) throw new Error('Context seems to not be init. Call init before');
    context.delete(key);
  },
};

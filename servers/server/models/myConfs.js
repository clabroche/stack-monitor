const pathfs = require('path');
const os = require('os');
const {
  existsSync, mkdirSync, writeFileSync, readFileSync,
} = require('fs');

const persistencePath = pathfs.resolve(os.homedir(), '.stack-monitor');

if (!existsSync(persistencePath)) mkdirSync(persistencePath, { recursive: true });
const confsPath = pathfs.resolve(persistencePath, 'confs');
if (!existsSync(confsPath)) writeFileSync(confsPath, JSON.stringify([]), 'utf-8');
const store = JSON.parse(readFileSync(confsPath, 'utf-8'));

module.exports = {
  /** @type {string[]} */
  confs: store,
  /** @param {string} conf */
  async add(conf) {
    if (!store.includes(conf)) {
      store.push(conf);
      await writeFileSync(confsPath, JSON.stringify(store), 'utf-8');
    }
  },
  /** @param {string} conf */
  async remove(conf) {
    store.splice(store.indexOf(conf), 1);
    await writeFileSync(confsPath, JSON.stringify(store), 'utf-8');
  },
};

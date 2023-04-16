const pathfs = require('path')
const fse = require('fs-extra')
const os = require('os')

const persistencePath = pathfs.resolve(os.homedir(), '.stack-monitor')

if (!fse.existsSync(persistencePath)) fse.mkdirpSync(persistencePath)
const confsPath = pathfs.resolve(persistencePath, 'confs')
if(!fse.existsSync(confsPath)) fse.writeJSONSync(confsPath, [])
const store = fse.readJSONSync(confsPath)

module.exports = {
  /** @type {string[]} */
  confs: store,
  /** @param {string} conf */
  async add(conf) {
    if(!store.includes(conf)) {
      store.push(conf)
      await fse.writeJSONSync(confsPath, store)
    }
  },
  /** @param {string} conf */
  async remove(conf) {
    store.splice(store.indexOf(conf), 1)
    await fse.writeJSONSync(confsPath, store)
  }
}
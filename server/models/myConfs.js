const pathfs = require('path')
const fse = require('fs-extra')
const persistencePath = pathfs.resolve(__dirname, '..', 'persistence')
const confsPath = pathfs.resolve(persistencePath, 'confs')
if(!fse.existsSync(confsPath)) fse.writeJSONSync(confsPath, [])
const store = fse.readJSONSync(confsPath)
module.exports = {
  confs: store,
  async add(conf) {
    if(!store.includes(conf)) {
      store.push(conf)
      await fse.writeJSONSync(confsPath, store)
    }
  },
  async remove(conf) {
    store.splice(store.indexOf(conf), 1)
    await fse.writeJSONSync(confsPath, store)
  }
}
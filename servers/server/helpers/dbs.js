const {
  existsSync, mkdirSync, writeFileSync, readFileSync,
  unlinkSync,
} = require('fs');
const pathfs = require('path');
const {
  readdir, mkdir, writeFile, readFile,
} = require('fs/promises');
const { fdir } = require('fdir');
const PromiseB = require('bluebird');
const { sockets } = require('@clabroche/common-socket-server');
const args = require('./args');
const { encrypt, decrypt } = require('./crypto');

module.exports = new class {
  getRootPath() {
    const confPath = args.confPath || process.cwd();
    const rootPath = pathfs.resolve(confPath, '.stackmonitor/dbs');
    if (!existsSync(rootPath)) mkdirSync(rootPath, { recursive: true });
    return rootPath;
  }

  async getDbs(namespace = '') {
    const pathToDbs = pathfs.resolve(this.getRootPath(), namespace);
    if (!existsSync(pathToDbs)) await mkdir(pathToDbs, { recursive: true });
    return (await readdir(pathToDbs)).map((id) => id.replace(pathfs.extname(id), '').replace('.encrypted', ''));
  }

  async reencrypt(oldKey, newKey) {
    const api = new fdir().withFullPaths()
      .filter((path) => path.endsWith('encrypted.json'))
      .crawl(this.getRootPath());
    await PromiseB.map(api.withPromise(), async (file) => {
      const fileEncrypted = await readFile(file, 'utf-8');
      const additionnalNonce = file.split('.stackmonitor').pop();
      const fileDecrypted = await decrypt(fileEncrypted, { additionnalNonce, encryptionKey: oldKey });
      const fileReEncrypted = await encrypt(fileDecrypted, { additionnalNonce, encryptionKey: newKey });
      await writeFile(file, fileReEncrypted, 'utf-8');
    });
  }

  getDb(id, { encrypted } = { encrypted: true }) {
    const getPath = async () => {
      const persistencePath = pathfs.resolve(`${this.getRootPath()}/${id}${encrypted ? '.encrypted' : ''}.json`);
      if (!existsSync(pathfs.dirname(persistencePath))) await mkdir(pathfs.dirname(persistencePath), { recursive: true });
      if (!existsSync(persistencePath)) await writeFile(persistencePath, JSON.stringify({}, null, 2), 'utf-8');
      return persistencePath;
    };
    return {
      getPath,
      write: async (data) => {
        let db = JSON.stringify(data, null, 2);
        const path = await getPath();
        const additionnalNonce = path.split('.stackmonitor').pop();
        if (encrypted) db = await encrypt(db, { additionnalNonce });
        writeFileSync(path, db, 'utf-8');
      },
      read: async () => {
        const path = await getPath();
        const additionnalNonce = path.split('.stackmonitor').pop();
        let db = readFileSync(path, 'utf-8');
        if (encrypted) {
          db = await decrypt(db, { additionnalNonce })
            .catch((err) => {
              console.log(JSON.stringify(['stack-monitor', 'decytpfzefze'],(_, v) => (typeof v === 'function' ? `[func]` : v)));
              console.error(err);
              sockets.emit('system:wrongKey');
              throw err;
            });
        }
        return JSON.parse(db);
      },
      delete: async () => unlinkSync(await getPath(id)),
    };
  }
}();

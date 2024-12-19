const { existsSync } = require('fs');
const path = require('path');
const { writeFile, readFile, appendFile } = require('fs/promises');
const dbs = require('../helpers/dbs');
const { generateKey, encrypt, decrypt } = require('../helpers/crypto');

class EncryptionKey {
  constructor() {
    this.encryptionKey = '';
  }

  #getDb() {
    return dbs.getDb('encryption-key', { encrypted: false });
  }

  async init() {
    this.encryptionKey = (await this.#getDb().read()).encryptionKey;
    // Exclude db from git
    const dirname = path.dirname(await dbs.getDb('encryption-key', { encrypted: false }).getPath());
    const gitignorePath = path.resolve(dirname, '.gitignore');
    if (!existsSync(gitignorePath)) {
      writeFile(gitignorePath, 'encryption-key.json');
    } else {
      const hasGitIgnore = (await readFile(gitignorePath, 'utf-8')).split('\n').some((line) => line.trim() === 'encryption-key.json');
      if (!hasGitIgnore) await appendFile(gitignorePath, '\nencryption-key.json');
    }
  }

  async update() {
    return this.#getDb().write(this.toStorage());
  }

  toStorage() {
    return {
      encryptionKey: this.encryptionKey,
    };
  }

  async generateKey() {
    return generateKey();
  }

  async testKey(encryptionKey) {
    try {
      const result = await encrypt('toto', { encryptionKey });

      const decrypted = await decrypt(result, { encryptionKey });
      if (decrypted === 'toto') return true;
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async saveKey(key) {
    if (!await this.testKey(key)) throw new Error('Key not valid');
    try {
      const envSample = (await dbs.getDbs('envs'))[0];
      if (envSample) await dbs.getDb(`envs/${envSample}`).read();
      if (this.encryptionKey) await dbs.reencrypt(this.encryptionKey, key);
    } catch (error) {
      console.error(error);
    }
    this.encryptionKey = key;
    await this.update();
    await require('./stack').selectConf(require('./stack').getStack()?.confPath || '.');
    return key;
  }
}

module.exports = new EncryptionKey();

const fse = require('fs-extra');
const pathfs = require('path');
const { execAsync } = require('@clabroche/servers-server/helpers/exec');

class Npm {
  /** @param {import('@clabroche/servers-server/models/Service')} service */
  constructor(service) {
    this.service = service;
  }

  async isNpm() {
    if (this.service?.spawnOptions?.cwd) {
      const path = this.service.spawnOptions.cwd;
      return fse.existsSync(pathfs.resolve(path?.toString(), 'package.json'));
    }
    return null;
  }

  async packageJSON() {
    if (this.service?.spawnOptions?.cwd) {
      const path = this.service.spawnOptions.cwd;
      return fse.readJson(pathfs.resolve(path?.toString(), 'package.json'));
    }
    return {};
  }

  async packageLock() {
    if (this.service?.spawnOptions?.cwd) {
      const path = this.service.spawnOptions.cwd;
      return fse.readJson(pathfs.resolve(path?.toString(), 'package-lock.json')).catch((err) => {
        console.error(err);
        return {};
      });
    }
    return {};
  }

  /**
     * @returns {Promise<import('./index').Outdated>}
     */
  async outdated() {
    const result = await execAsync('npm outdated --json || true', { cwd: this.service?.spawnOptions?.cwd });
    return JSON.parse(result);
  }
}

module.exports = Npm;

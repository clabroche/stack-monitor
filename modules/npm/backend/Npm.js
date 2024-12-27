const pathfs = require('path');
const { execAsync } = require('@clabroche/servers-server/helpers/exec');
const { readFile } = require('fs/promises');
const { existsSync } = require('fs');

class Npm {
  /** @param {import('@clabroche/servers-server/models/Service')} service */
  constructor(service) {
    this.service = service;
  }

  async isNpm() {
    if (this.service?.commands?.[0]?.spawnOptions?.cwd) {
      const path = this.service.commands?.[0].spawnOptions.cwd;
      return existsSync(pathfs.resolve(path?.toString(), 'package.json'));
    }
    return null;
  }

  async packageJSON() {
    if (this.service?.commands?.[0]?.spawnOptions?.cwd) {
      const path = this.service.commands?.[0].spawnOptions.cwd;
      return JSON.parse(await readFile(pathfs.resolve(path?.toString(), 'package.json'), 'utf-8'));
    }
    return {};
  }

  async packageLock() {
    if (this.service?.commands?.[0]?.spawnOptions?.cwd) {
      const path = this.service.commands?.[0].spawnOptions.cwd;
      return JSON.parse(await readFile(pathfs.resolve(path?.toString(), 'package-lock.json'), 'utf-8')).catch((err) => {
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
    const result = await execAsync('npm outdated --json || true', { cwd: this.service?.commands?.[0]?.spawnOptions?.cwd });
    return JSON.parse(result);
  }
}

module.exports = Npm;

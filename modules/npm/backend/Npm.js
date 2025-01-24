const pathfs = require('path');
const { execAsync } = require('@clabroche/servers-server/helpers/exec');
const { readFile } = require('fs/promises');
const { replaceEnvs } = require('../../../servers/server/helpers/stringTransformer.helper');
const { existsSync } = require('fs');

class Npm {
  /** @param {import('@clabroche/servers-server/models/Service')} service */
  constructor(service) {
    this.service = service;
  }

  async isNpm(path) {
    if (path) {
      return existsSync(pathfs.resolve(path?.toString(), 'package.json'));
    }
    return null;
  }

  getNpmPaths() {
    return [
      ...this.service.commands
        .filter(cmd => cmd.spawnOptions.cwd?.toString()?.trim() && cmd.spawnOptions.cwd !== '.')
        .map(cmd => replaceEnvs(cmd.spawnOptions.cwd)),
      this.service.getRootPath(),
    ].filter(cwd => this.isNpm(cwd))
  }

  async packageJSON(path) {
    if (path) {
      return JSON.parse(await readFile(pathfs.resolve(path?.toString(), 'package.json'), 'utf-8'));
    }
    return {};
  }

  async packageLock(path) {
    if (path) {
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
  async outdated(path) {
    const result = await execAsync('npm outdated --json || true', { cwd: path });
    return JSON.parse(result);
  }
}

module.exports = Npm;

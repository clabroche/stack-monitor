const fse = require('fs-extra');
const pathfs = require('path');
const { execAsync } = require('../../../servers/server/helpers/exec');

/** @param {import('../../../servers/server/models/Service')} service */
function Npm(service) {
  this.service = service;
}

Npm.prototype.isNpm = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd;
    return fse.existsSync(pathfs.resolve(path?.toString(), 'package.json'));
  }
  return null;
};
Npm.prototype.packageJSON = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd;
    return fse.readJson(pathfs.resolve(path?.toString(), 'package.json'));
  }
  return {};
};
Npm.prototype.packageLock = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd;
    return fse.readJson(pathfs.resolve(path?.toString(), 'package-lock.json')).catch((err) => {
      console.error(err);
      return {};
    });
  }
  return {};
};

/**
 * @returns {Promise<import('./index').Outdated>}
 */
Npm.prototype.outdated = async function () {
  const result = await execAsync('npm outdated --json || true', { cwd: this.service?.spawnOptions?.cwd });
  return JSON.parse(result);
};

module.exports = Npm;

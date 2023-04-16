const fse = require('fs-extra')
const {spawn, ChildProcess} = require('child_process')
const pathfs = require('path')
const { execAsync } = require('../../server/helpers/exec')

/** @param {import('../../server/models/Service')} service*/
function Npm(service) {
  this.service = service
}

Npm.prototype.isNpm = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.existsSync(pathfs.resolve(path?.toString(), 'package.json'))
  }
}
Npm.prototype.packageJSON = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path?.toString(), 'package.json'))
  }
  return {}
}
Npm.prototype.packageLock = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path?.toString(), 'package-lock.json')).catch((err) => {
      console.error(err)
      return {}
    })
  }
  return {}
}

/**
 * @returns {Promise<import('./index').Outdated>}
 */
Npm.prototype.outdated = async function () {
  const result = await execAsync('npm outdated --json || true', {cwd: this.service?.spawnOptions?.cwd})
  return JSON.parse(result)
}

/**
 * @type {Record<string, string[]>}
 */
const defaultCommand = {
  install: ['i'],
  rebuild: ['rebuild'],
}
/**
 * @param {string} command 
 * @returns {Promise<ChildProcess | undefined>}
 */
Npm.prototype.run = async function (command) {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    const cmd = command.split(' ')
    const args = defaultCommand[command]
      ? defaultCommand[command]
      : ['run', ...cmd]
    return spawn('npm', args, { cwd: path, env: Object.assign({}, process.env, this.service.spawnOptions.env), shell: true })
  }
}

module.exports = Npm
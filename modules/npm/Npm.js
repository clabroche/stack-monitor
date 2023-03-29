const fse = require('fs-extra')
const {spawn} = require('child_process')
const pathfs = require('path')
const { execAsync } = require('../../server/helpers/exec')

function Npm(service) {
  this.service = service
}

Npm.prototype.isNpm = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.existsSync(pathfs.resolve(path, 'package.json'))
  }
}
Npm.prototype.packageJSON = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path, 'package.json'))
  }
  return {}
}
Npm.prototype.packageLock = async function () {
  if (this.service?.spawnOptions?.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path, 'package-lock.json')).catch((err) => {
      console.error(err)
      return {}
    })
  }
  return {}
}

/**
 * 
 * @returns {Promise<Record<string, {
 *   "current": string,
 *   "wanted": string,
 *   "latest": string,
 *   "dependent": string,
 *   "location": string,
 * }>>}
 */
Npm.prototype.outdated = async function () {
  const result = await execAsync('npm outdated --json || true', {encoding: 'utf-8', cwd: this.service?.spawnOptions?.cwd})
  return JSON.parse(result)
}

const defaultCommand = {
  install: ['i'],
  rebuild: ['rebuild'],
}
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
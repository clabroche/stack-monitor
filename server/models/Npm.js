const fse = require('fs-extra')
const {spawn} = require('child_process')
const pathfs = require('path')
const PromiseB = require('bluebird')
const semver = require('semver')
const packageJSONLib = require('package-json')

function Npm(service) {
  this.service = service
}

Npm.prototype.isNpm = async function () {
  if (this.service && this.service.spawnOptions && this.service.spawnOptions.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.existsSync(pathfs.resolve(path, 'package.json'))
  }
}
Npm.prototype.packageJSON = async function () {
  if (this.service && this.service.spawnOptions && this.service.spawnOptions.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path, 'package.json'))
  }
  return {}
}
Npm.prototype.packageLock = async function () {
  if (this.service && this.service.spawnOptions && this.service.spawnOptions.cwd) {
    const path = this.service.spawnOptions.cwd
    return fse.readJson(pathfs.resolve(path, 'package-lock.json')).catch((err) => {
      console.error(err)
      return {}
    })
  }
  return {}
}
Npm.prototype.outdated = async function () {
  const packageJSON = await this.packageJSON()
  const packageLock = await this.packageLock()
  const packageNames = []
  if (packageJSON.dependencies) {
    packageNames.push(...Object.keys(packageJSON.dependencies))
  }
  if (packageJSON.devDependencies) {
    packageNames.push(...Object.keys(packageJSON.devDependencies))
  }
  return PromiseB.map(packageNames, async packageName => {
    const resolved = packageLock.dependencies[packageName].resolved
    if(!resolved) return
    const registryUrl = resolved.split(packageName)[0]
    const infos = await packageJSONLib(packageName, { allVersions: true, registryUrl })
      .catch(() => { })
    if (infos) {
      const allVersions = Object.keys(infos.versions).reverse()
      const currentVersion = packageLock.dependencies[packageName].version
      const currentSemVersion = packageJSON.dependencies[packageName] || packageJSON.devDependencies[packageName]
      const satisfyVersion = semver.maxSatisfying(allVersions, currentSemVersion)
      const latestVersion = semver.maxSatisfying(allVersions, '<8888.0.0')
      return {
        satisfyVersion: semver.clean(satisfyVersion),
        currentVersionCleaned: semver.clean(currentVersion),
        currentVersion,
        latestVersion: semver.clean(latestVersion),
        isUpToDate: satisfyVersion === currentVersion,
        packageName
      }
    }
  }).reduce((obj, dep) => {
    if (dep) {
      obj[dep.packageName] = dep
    }
    return obj
  }, {})
}

const defaultCommand = {
  install: ['i'],
  rebuild: ['rebuild'],
}
Npm.prototype.run = async function (command) {
  if (this.service && this.service.spawnOptions && this.service.spawnOptions.cwd) {
    const path = this.service.spawnOptions.cwd
    const cmd = command.split(' ')
    const args = defaultCommand[command]
      ? defaultCommand[command]
      : ['run', ...cmd]
    return spawn('npm', args, { cwd: path })
  }
}

module.exports = Npm
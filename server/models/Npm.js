const fse = require('fs-extra')
const {spawn} = require('child_process')
const pathfs = require('path')

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
    
    const process =  spawn('npm', args, { cwd: path})
    return process
  }
}

module.exports = Npm
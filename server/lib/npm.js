const fs = require('fs-extra')
const pathfs = require('path')
const { exec } = require('child_process')

module.exports = {
  getNpmInfos,
  outdated
}

async function getNpmInfos(path) {
  const readdir = await fs.readdir(path)
  if (readdir.includes('package.json')) {
    const packageJSON = await fs.readJSON(pathfs.resolve(path, 'package.json'))
    return {
      path,
      packageJSON,
      version: packageJSON.version,
      name: packageJSON.name,
      author: packageJSON.author
    }
  }
}

async function outdated(cwd) {
  const outdated = await bash('npm outdated --json --depth 0', { cwd })
    .catch(err => err)
  return JSON.parse(outdated)
}

async function bash(cmd, options) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (err, stdout, stderr) => {
      if (stderr) return reject(stderr)
      return resolve(stdout)
    })
  });
}
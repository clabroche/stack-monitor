const fs = require('fs-extra')
const pathfs = require('path')

module.exports = {
  getNpmInfos,
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
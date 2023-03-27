var express = require('express');
var router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const PromiseB = require('bluebird')
const os = require('os')
const {sort} = require('fast-sort')


router.get('/home-dir', async function (req, res) {
  res.send(os.homedir())
})
router.get('/ls', async function (req, res) {
  const path = req.query.path
  const readdir = await fse.readdir(req.query.path.toString())
  const parentDirectory = {
    absolutePath: pathfs.resolve(path.toString(), '..'),
    name: '..',
    isDirectory: true
  }
  let dirs = [parentDirectory]
  await PromiseB.map(readdir, async entry => {
    try {
      if (entry.charAt(0) === '.') return
      const absolutePath = pathfs.resolve(path.toString(), entry)
      const stat = await fse.stat(absolutePath)
      const entryInfos = {
        absolutePath,
        name: entry,
        isDirectory: stat.isDirectory(),
        npmInfos: null,
        isStack: false
      }
      if (entryInfos.isDirectory) {
        entryInfos.npmInfos = await getNpmInfos(entryInfos.absolutePath)
      } else {
        if(pathfs.extname(absolutePath) === '.js') {
          try {
            const stack = require(absolutePath)
            if (Array.isArray(stack) && stack.length && stack[0].label && stack[0].spawnCmd) {
              entryInfos.isStack = true
            }
          // eslint-disable-next-line no-empty
          } catch (error) {
            console.error(error)
          }
        }
      }
      dirs.push(entryInfos)
    } catch (error) {
      console.error(error)
      return null      
    }
  })
  // @ts-ignore
  dirs = sort(dirs).asc(d => d.name.toUpperCase())
  res.json(dirs)
});


async function getNpmInfos(path) {
  const readdir = await fse.readdir(path)
  if (readdir.includes('package.json')) {
    const packageJSON = await fse.readJSON(pathfs.resolve(path, 'package.json'))
    return {
      path,
      packageJSON,
      version: packageJSON.version,
      name: packageJSON.name,
      author: packageJSON.author
    }
  }
}
module.exports = router;
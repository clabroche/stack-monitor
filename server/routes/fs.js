var express = require('express');
var router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const PromiseB = require('bluebird')
const os = require('os')
const sort = require('fast-sort')
const npm = require('../lib/npm')


// router.get('/import', async function (req, res) {
//   const infos = await npm.getNpmInfos(req.query.path)
//   res.json(infos)
// });
router.get('/outdated', async function (req, res) {
  await npm.outdated(req.query.path)
    .then(infos => res.send(infos))
    .catch(err => res.status(200).send(err))
});
// router.get('/open-dir', async function (req, res) {
//   res.json(process.argv[2])
// });
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
        entryInfos.npmInfos = await npm.getNpmInfos(entryInfos.absolutePath)
      } else {
        if(pathfs.extname(absolutePath) === '.js') {
          try {
            const stack = require(absolutePath)
            if (Array.isArray(stack) && stack.length && stack[0].label && stack[0].spawnCmd) {
              entryInfos.isStack = true
            }
          // eslint-disable-next-line no-empty
          } catch (error) {}
        }
      }
      dirs.push(entryInfos)
    } catch (error) {
      return null      
    }
  })
  // @ts-ignore
  dirs = sort(dirs).asc(d => d.name.toUpperCase())
  res.json(dirs)
});

module.exports = router;
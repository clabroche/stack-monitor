const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const PromiseB = require('bluebird')


/** @param {import('../../typings/index').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const {findService} = stackMonitor
  /**
   * 
   * @param {string} rootPath 
   * @param {string} pathToExplore 
   * @param {(path: string) => string} stripPath 
   * @returns {Promise<import('./index').Leaf[] | null>}
   */
  async function walker(rootPath, pathToExplore, stripPath) {
    const fullPath = pathfs.resolve(rootPath, pathToExplore)
    const dir = await PromiseB.mapSeries(fse.readdir(fullPath), async _path => {
      const newPath = pathfs.resolve(fullPath, _path)
      const isDir = fse.statSync(newPath).isDirectory()
      /** @type {import('./index').Leaf} */
      return {
        isDir,
        name: pathfs.basename(newPath),
        ext: pathfs.extname(newPath),
        path: stripPath ? stripPath(newPath) : newPath,
        children: isDir ? await walker(rootPath, newPath, stripPath) : null 
      }
    }).filter(a => (
      (a.isDir && !!a.children?.length) ||
      (a.ext === '.md')
    ))
    return dir
  }
  
  router.get('/documentation/service/:label', async (req, res) => {
    const service = findService(req.params.label)
    const path = req.query.path?.toString() || '.'
    const dir = await walker(pathfs.resolve(service.documentation), path, (path) => path.replace(pathfs.resolve(service.documentation), '.'))
    res.json(dir)
  })
  
  router.get('/documentation/service/:label/:path', async (req, res) => {
    const service = findService(req.params.label)
    const file = await fse.readFile(pathfs.resolve(service.documentation, req.params.path), {encoding: 'utf-8'})
    res.send(file)
  })
  return router
};
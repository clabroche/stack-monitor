const fse = require('fs-extra')
const pathfs = require('path')

const modulesRootPath = pathfs.resolve(__dirname, '..','..','modules')
const routes = []
const forService = []
const sidebar = []
const all = fse.readdirSync(modulesRootPath)
    .map(dirname => pathfs.resolve(modulesRootPath, dirname))
    .map(modulePath => {
      const plugin = loadModule(modulePath)
      if(!plugin) return 
      if (plugin?.placements?.includes("service")) forService.push(plugin)
      if (plugin?.placements?.includes("sidebar") || plugin?.placements?.find(p => p.position === 'sidebar')) sidebar.push(plugin)
      if(plugin?.routes) {
        routes.push(plugin.routes)
        delete plugin.routes 
      }
      return plugin
    })
    .filter(a => a)
module.exports = {
  forService,
  all,
  sidebar,
  routes
}

function loadModule(modulePath) {
  const indexPath = pathfs.resolve(modulePath, 'index.js')
  const plugin = fse.existsSync(indexPath) ? require(indexPath) : null
  if(!plugin) return
  if (typeof plugin === 'function') return plugin()
  else return plugin
}
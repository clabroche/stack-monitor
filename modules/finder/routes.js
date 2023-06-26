const express = require('express');
const router = express.Router();

/**
 * @param {string} str 
 * @param {string} search 
 */
function searchString(str, search) {
  return str?.toUpperCase()?.includes(search)
}

/**
 * 
 * @param {import('../views').PluginSM<any>} plugin 
 */
function pluginToUrl(plugin) {
  for (let i = 0; i < plugin.placements.length; i++) {
    const placement = plugin.placements[i];
    if(typeof placement !== 'string') {
      if(placement.position === 'toolbox') {
        return `/toolbox${placement.goTo?.path || placement.goTo}`
      }
      if(placement.position === 'sidebar') {
        return `${placement.goTo?.path || placement.goTo}`
      }
    }
  }
} 

/** @param {import('../../typings/export').StackMonitor} stackMonitor */
const routes = (stackMonitor) => {
  const { getServices } = stackMonitor
  router.get('/finder/search', async function (req, res) {
    const search = req.query.q?.toString()?.toUpperCase() || ''
    /** @type {FinderChoice[]} */
    const services = getServices()
      .filter((service) => searchString(service?.label, search))
      .map(service => ({
        title: service.label,
        description: service.description,
        group: 'Service',
        url: `/stack-single/${service.label}`
      }))
    
    const plugins = require('../plugins');
    const _plugins = Object.keys(plugins)
      .map((/** @type {keyof typeof plugins}*/key) => plugins[key])
      .filter((plugin) => searchString(plugin.name, search))
      .map(plugin => ({
        title: plugin.displayName || plugin.name,
        description: plugin.description,
        group: 'Plugin',
        icon: plugin.icon,
        url: pluginToUrl(plugin)
      }))
      .filter(a => a.url)

    /** @type {FinderChoice[]} */
    const result = [
      ...services,
      ..._plugins
    ].filter(a => a)
    res.send(result)
  })
  return router
}

module.exports = routes

/**
 * @typedef {{
 *  icon?: string,
 *  title: string,
 *  group?: string,
 *  description?: string,
 *  secondaryTitle?: string
 *  secondaryDescription?: string,
 *  url?: string,
 * }} FinderChoice
 */


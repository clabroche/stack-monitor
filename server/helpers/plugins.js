const Stack = require('../models/stack')
const plugins = require('../../modules/plugins');

/** @type {import('express').Router[]} */
const routes = [];
/** @type {PluginSM<null>[]} */
const forService = [];
/** @type {Record<string, PluginSM<null>[]>} */
const allPlugins = {}

Object.keys(plugins)
  .map(key => plugins[/**@type {keyof (typeof plugins)}*/(key)])
  .forEach((plugin) => {
    if (!plugin) return;
    if (plugin.placements?.includes("service")) forService.push(plugin);
    if (plugin.routes) {
      routes.push(plugin.routes(Stack));
      delete plugin.routes;
    }
    (plugin.placements || []).forEach((p) => {
      const position = typeof p === 'string' ? p : p.position 
      if (!position) return;
      if (!allPlugins[position]) allPlugins[position] = [];
      if (!allPlugins[position].includes(plugin))
        allPlugins[position].push({
          ...plugin,
          placements: (plugin.placements || []).filter(_p => typeof _p !=='string' && _p.position === position)
        });
    });
    return plugin;
  })
module.exports = {
  forService,
  ...allPlugins,
  routes,
};

/**
 * @typedef {import('../../modules/views').PluginSM<unknown>} PluginSM
 */
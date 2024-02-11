const plugins = require('@clabroche/modules-plugins-loader-backend');
const Stack = require('../models/stack');

/** @type {import('express').Router[]} */
const routes = [];
/** @type {PluginSM[]} */
const forService = [];
/** @type {Record<string, PluginSM[]>} */
const allPlugins = {};

Object.keys(plugins)
  .map((key) => plugins[/** @type {keyof (typeof plugins)} */(key)])
  .forEach((plugin) => {
    if (!plugin) return null;
    if (plugin.placements?.includes('service')) forService.push(plugin);
    if (plugin.routes) {
      routes.push(plugin.routes(Stack));
      delete plugin.routes;
    }
    (plugin.placements || []).forEach((p) => {
      const position = typeof p === 'string' ? p : p.position;
      if (!position) return null;
      if (!allPlugins[position]) allPlugins[position] = [];
      if (!allPlugins[position].includes(plugin)) {
        allPlugins[position].push({
          ...plugin,
          placements: (plugin.placements || []).filter((_p) => typeof _p !== 'string' && _p.position === position),
        });
      }
      return null;
    });
    return plugin;
  });
module.exports = {
  forService,
  ...allPlugins,
  routes,
};

/**
 * @typedef {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<unknown>} PluginSM
 */

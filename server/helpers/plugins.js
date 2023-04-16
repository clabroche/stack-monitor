const fse = require("fs-extra");
const pathfs = require("path");

const modulesRootPath = pathfs.resolve(__dirname, "..", "..", "modules");

/** @type {import('express').Router[]} */
const routes = [];
/** @type {PluginSM[]} */
const forService = [];
/** @type {Record<string, PluginSM[]>} */
const plugins = {};

const all = fse
  .readdirSync(modulesRootPath)
  .map((dirname) => pathfs.resolve(modulesRootPath, dirname))
  .map((modulePath) => {
    const plugin = loadModule(modulePath);
    if (!plugin) return;
    if (plugin?.placements?.includes("service")) forService.push(plugin);
    if (plugin?.routes) {
      routes.push(plugin.routes);
      delete plugin.routes;
    }
    (plugin?.placements || []).map((p) => {
      const position = typeof p === 'string' ? p : p.position 
      if (!position) return;
      if (!plugins[position]) plugins[position] = [];
      if (!plugins[position].includes(plugin))
        plugins[position].push({
          ...plugin,
          placements: (plugin.placements || []).filter(_p => typeof _p !=='string' && _p.position === position)
        });
    });
    return plugin;
  })
  .filter((a) => a);
module.exports = {
  forService,
  all,
  ...plugins,
  routes,
};

/**
 * 
 * @param {string} modulePath 
 * @returns {PluginSM | undefined}
 */
function loadModule(modulePath) {
  const indexPath = pathfs.resolve(modulePath, "index.js");
  const plugin = fse.existsSync(indexPath) ? require(indexPath) : null;
  if (!plugin) return;
  if (typeof plugin === "function") return plugin();
  else return plugin;
}


/**
 * @typedef {import('../../modules/views').PluginSM} PluginSM
 */
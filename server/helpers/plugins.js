const fse = require("fs-extra");
const pathfs = require("path");

const modulesRootPath = pathfs.resolve(__dirname, "..", "..", "modules");
const routes = [];
const forService = [];
const sidebar = [];
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
      if (!p.position) return;
      if (!plugins[p.position]) plugins[p.position] = [];
      if (!plugins[p.position].includes(plugin))
        plugins[p.position].push(
          {
            ...plugin,
            placements: (plugin.placements || []).filter(_p => _p.position === p.position)
          }
        );
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

function loadModule(modulePath) {
  const indexPath = pathfs.resolve(modulePath, "index.js");
  const plugin = fse.existsSync(indexPath) ? require(indexPath) : null;
  if (!plugin) return;
  if (typeof plugin === "function") return plugin();
  else return plugin;
}

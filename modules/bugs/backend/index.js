const { existsSync } = require('fs');
const pathfs = require('path');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Bugs',
  displayName: 'Bugs',
  description: 'Find bugs across a whole javascript project',
  icon: 'fas fa-bug',
  placements: ['service'],
  order: 4,
  export: null,
  hidden: async (service) => {
    if (!service) return true;
    const serviceIsNpm = await isNpm(service);
    return !serviceIsNpm;
  },
  routes: require('./routes'),
};
module.exports = plugin;

/** @param {import('../../../servers/server/models/Service')} service */
async function isNpm(service) {
  const path = service?.spawnOptions?.cwd;
  return path
    ? existsSync(pathfs.resolve(path.toString(), 'package.json'))
    : false;
}

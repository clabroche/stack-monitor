/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Documentation',
  displayName: 'Documentation',
  description: 'Read documentation for a given service',
  icon: 'fas fa-book',
  export: null,
  placements: ['service'],
  order: 6,
  /** @param {import('../../server/models/Service')} service*/
  hidden: (service) => !service.documentation, 
  routes: require('./routes'),
}
module.exports = plugin

/**
 * @typedef {{
 *  name: string,
 *  isDir: boolean,
 *  path: string,
 *  ext: string,
 *  children:Leaf[] | null
 * }} Leaf
 */
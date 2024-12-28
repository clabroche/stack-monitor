const { readFile } = require('fs/promises');
const PromiseB = require('bluebird');
const pathfs = require('path');
const Documentation = require('./Documentation');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./Documentation')>} */
const plugin = {
  enabled: true,
  name: 'Documentation',
  displayName: 'Documentation',
  description: 'Read documentation for a given service',
  icon: 'fas fa-book',
  export: Documentation,
  placements: ['service'],
  order: 6,
  /** @param {import('../../../servers/server/models/Service')} service */
  hidden: (service) => {
    if (!service) return false;
    return !service?.documentation;
  },
  routes: require('./routes'),
  finder: async (search, stackMonitor) => {
    const services = stackMonitor.getServices()?.filter((/** @type {any} */s) => s.documentation);
    const servicesFiles = (await PromiseB.map(services, async (service) => {
      const files = await stackMonitor.documentation.getFlatFiles('.', service.documentation);
      return PromiseB.filter(files, (leaf) => !leaf.isDir)?.map(async (path) => {
        const content = path.path && await readFile(pathfs.resolve(service.documentation, path.path), { encoding: 'utf-8' }).catch(console.error);
        return { service, path, content };
      }) || [];
    })).flat()
      .filter((file) => stackMonitor.helpers.searchString(file.path?.name || '', search) || stackMonitor.helpers.searchString(file.content || '', search));
    return [
      ...servicesFiles.map((file) => ({
        icon: 'fas fa-book',
        title: file.path.name || '',
        group: 'Documentation',
        description: `Read documentation for ${file.service.label}`,
        secondaryTitle: file.service.label,
        url: { path: `/stack-single/${encodeURIComponent(file.service.label)}`, query: { tab: 'Documentation', leaf: file.path.path } },
      })),
    ];
  },
};
module.exports = plugin;

/**
 * @typedef {{
 *  id: string,
 *  name: string,
 *  isDir: boolean,
 *  path: string,
 *  ext: string,
 *  opened: boolean,
 *  children:Leaf[] | null
 * }} Leaf
 */

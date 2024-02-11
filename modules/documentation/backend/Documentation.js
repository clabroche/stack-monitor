const fse = require('fs-extra');
const pathfs = require('path');
const PromiseB = require('bluebird');
const { v4 } = require('uuid');

/**
 *
 * @param {string} rootPath
 * @param {string} pathToExplore
 * @param {(path: string) => string} stripPath
 * @param {import('./index').Leaf[]} leafs
 * @returns {Promise<import('./index').Leaf[] | null>}
 */
async function walker(rootPath, pathToExplore, stripPath, leafs = []) {
  const fullPath = pathfs.resolve(rootPath, pathToExplore);
  const dir = await PromiseB.mapSeries(fse.readdir(fullPath), async (_path) => {
    const newPath = pathfs.resolve(fullPath, _path);
    const isDir = fse.statSync(newPath).isDirectory();
    /** @type {import('./index').Leaf} */
    const leaf = {
      id: v4(),
      isDir,
      name: pathfs.basename(newPath),
      ext: pathfs.extname(newPath),
      path: stripPath ? stripPath(newPath) : newPath,
      children: isDir ? await walker(rootPath, newPath, stripPath, leafs) : null,
    };
    leafs.push(leaf);
    return leaf;
  }).filter((a) => (
    (a.isDir && !!a.children?.length)
    || (a.ext === '.md')
  ));
  return dir;
}

/** @param {import('@clabroche/fronts-app/typings/export').StackMonitor} stackMonitor */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Documentation = (stackMonitor) => ({
  /**
     * @param {string} path
     * @param {import('@clabroche/fronts-app/typings/export').Service} service
     * @param {import('./index').Leaf[]} leafs
     */
  getTree(path, service, leafs = []) {
    return walker(
      pathfs.resolve(service.documentation),
      path,
      (path) => path.replace(pathfs.resolve(service.documentation), '.'),
      leafs,
    );
  },
  /**
     * @param {string} path
     * @param {import('@clabroche/fronts-app/typings/export').Service} service
     */
  async getFlatFiles(path, service) {
    /** @type {import('./index').Leaf[]} */
    const leafs = [];
    await this.getTree(path, service, leafs);
    return leafs;
  },

  /**
     * @param {string} path
     * @param {import('@clabroche/fronts-app/typings/export').Service} service
     */
  readFile(path, service) {
    return fse.readFile(pathfs.resolve(service.documentation, path), { encoding: 'utf-8' });
  },
  /**
     * @param {string} path
     * @param {import('@clabroche/fronts-app/typings/export').Service} service
     * @param {string} page
     */
  async writeFile(path, service, page) {
    await fse.writeFile(pathfs.resolve(service.documentation, path), page, { encoding: 'utf-8' });
    return fse.readFile(pathfs.resolve(service.documentation, path), { encoding: 'utf-8' });
  },
});
module.exports = Documentation;

const pathfs = require('path');
const { readFile, writeFile, readdir } = require('fs/promises');
const { statSync } = require('fs');
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
  const dir = await PromiseB.mapSeries(readdir(fullPath), async (_path) => {
    const newPath = pathfs.resolve(fullPath, _path);
    const isDir = statSync(newPath).isDirectory();
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

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Documentation = (stackMonitor) => ({
  /**
     * @param {string} path
     * @param {string} documentationPath
     * @param {import('./index').Leaf[]} leafs
     */
  getTree(path, documentationPath, leafs = []) {
    return walker(
      documentationPath,
      path,
      (path) => path.replace(documentationPath, '.'),
      leafs,
    );
  },
  /**
     * @param {string} path
     * @param {string} documentationPath
     */
  async getFlatFiles(path, documentationPath) {
    /** @type {import('./index').Leaf[]} */
    const leafs = [];
    await this.getTree(path, documentationPath, leafs);
    return leafs;
  },

  /**
     * @param {string} path
     * @param {string} documentationPath
     */
  readFile(path, documentationPath) {
    return readFile(pathfs.resolve(documentationPath, path), { encoding: 'utf-8' });
  },
  /**
     * @param {string} path
     * @param {string} documentationPath
     * @param {string} page
     */
  async writeFile(path, documentationPath, page) {
    await writeFile(pathfs.resolve(documentationPath, path), page, { encoding: 'utf-8' });
    return readFile(pathfs.resolve(documentationPath, path), { encoding: 'utf-8' });
  },
});
module.exports = Documentation;

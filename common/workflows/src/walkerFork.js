const fs = require('fs-extra');
const pathfs = require('path');
const PromiseB = require('bluebird');

process.on('message', async (/** @type {Record<string, any>} */conf) => {
  const path = conf.dir;
  const dirs = [];
  const files = [];
  if (
    pathfs.basename(path).charAt(0) === '.'
    || (['node_modules'].includes(pathfs.basename(path)))
  ) return process.send?.({ dirs, npmPath: null });
  await fs
    .readdir(path)
    .then(async (_files) => {
      await PromiseB.map(_files, async (file) => {
        if (file.charAt(0) === '.' && file !== '.mirror') return;
        const absolutePath = pathfs.resolve(path, file);
        const stat = await fs.stat(absolutePath);
        if (stat.isDirectory() && file !== 'out') {
          dirs.push(absolutePath);
        } else if (stat.isFile()) {
          files.push(absolutePath);
        }
      });

      process.send?.({
        dirs, files,
      });
    });
  return null;
});

const { express } = require('@clabroche/common-express');

const router = express.Router();
const pathfs = require('path');
const PromiseB = require('bluebird');
const os = require('os');
const { sort } = require('fast-sort');
const { readdir, readFile, stat } = require('fs/promises');

router.get('/home-dir', async (req, res) => {
  res.send(os.homedir());
});
router.get('/ls', async (req, res) => {
  const path = req.query.path?.toString() || __dirname;
  const dir = await readdir(path);
  const parentDirectory = {
    absolutePath: pathfs.resolve(path, '..'),
    name: '..',
    isDirectory: true,
  };
  let dirs = [parentDirectory];
  await PromiseB.map(dir, async (entry) => {
    try {
      if (entry.charAt(0) === '.') return null;
      const absolutePath = pathfs.resolve(path, entry);
      const entryStat = await stat(absolutePath);
      /** @type {Entry} */
      const entryInfos = {
        absolutePath,
        name: entry,
        isDirectory: entryStat.isDirectory(),
        npmInfos: null,
        isStack: false,
      };
      if (entryInfos.isDirectory) {
        entryInfos.npmInfos = await getNpmInfos(entryInfos.absolutePath);
      } else if (pathfs.extname(absolutePath) === '.js') {
        try {
          const stack = require(absolutePath);
          if (Array.isArray(stack) && stack.length && stack[0].label && stack[0].spawnCmd) {
            entryInfos.isStack = true;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {
          console.error(error);
        }
      }
      dirs.push(entryInfos);
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  });
  // @ts-ignore
  dirs = sort(dirs).asc((d) => d.name.toUpperCase());
  res.json(dirs);
});

/**
 *
 * @param {string} path
 */
async function getNpmInfos(path) {
  const dir = await readdir(path);
  if (dir.includes('package.json')) {
    const packageJSON = JSON.parse(await readFile(pathfs.resolve(path, 'package.json'), 'utf-8'));
    /** @type {NpmInfos} */
    return {
      path,
      packageJSON,
      version: packageJSON.version,
      name: packageJSON.name,
      author: packageJSON.author,
    };
  }
  return null;
}
module.exports = router;

/**
 * @typedef {{
 * absolutePath: string
 * name: string
 * isDirectory: boolean
 * npmInfos?: NpmInfos | null
 * isStack: boolean
 * }} Entry
 */

/**
 * @typedef {{
 * path: string,
 * packageJSON: Record<string, any>,
 * version: string,
 * name: string,
 * author: string
 * }} NpmInfos
 */

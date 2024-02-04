const fse = require('fs-extra');
const pathfs = require('path');
const { execSync } = require('child_process');

const difference = (arr1, arr2) => arr1
  .filter((x) => !arr2.includes(x))
  .concat(arr2.filter((x) => !arr1.includes(x)));

module.exports = {
  checkIfAllWorkspacesAreLinkedToYarn,
  checkIfAllWorkspacesAreLinkedToLerna,
  getWorkspaces: (root = pathfs.resolve(__dirname, '..', '..', '..')) => exploreDir(root),
};
function checkIfAllWorkspacesAreLinkedToYarn() {
  const root = pathfs.resolve(__dirname, '..', '..', '..');
  const workspaces = exploreDir(root);
  const workspacesFromYarn = execSync('yarn workspaces list --json', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line.trim()))
    .filter((w) => w.location !== '.')
    .map((w) => {
      w.location = pathfs.resolve(root, w.location);
      return w;
    });
  const workspacesNames = workspaces.map((w) => w.path);
  const workspacesNamesFromYarn = workspacesFromYarn.map((w) => w.location);
  const differences = difference(workspacesNames, workspacesNamesFromYarn);

  if (differences?.length) {
    throw new Error(`Difference found, these workspaces are not linked to yarn:\n${differences.join('\n')}`);
  }
}

function checkIfAllWorkspacesAreLinkedToLerna() {
  const root = pathfs.resolve(__dirname, '..', '..', '..');
  const workspaces = exploreDir(root);
  const workspacesNamesFromLerna = execSync('yarn lerna exec "pwd"', { encoding: 'utf-8', cwd: root })
    .trim()
    .split('\n')
    .map((path) => path.trim());
  const workspacesNames = workspaces.map((w) => w.path);
  const differences = difference(workspacesNames, workspacesNamesFromLerna);

  if (differences?.length) {
    throw new Error(`Difference found, these workspaces are not linked to lerna:\n${differences.join('\n')}`);
  }
}

/**
 *
 * @param {string} rootDir
 * @returns {{
 *   path: string,
 *   packageJSON: {
 *     name: string,
 *     description: string,
 *     private?: boolean,
 *     scripts?: Record<string, string>,
 *     repository?: boolean,
 *     devDependencies: Record<string, string>,
 *     dependencies: Record<string, string>,
 *   }
 * }[]}
 */
const exploreDir = (rootDir) => fse
  .readdirSync(rootDir)
  .filter((dir) => !['node_modules', 'out'].includes(dir)
      && dir[0] !== '.')
  .map((dir) => pathfs.resolve(rootDir, dir))
  .filter((dir) => fse.statSync(dir).isDirectory())
  .map((dir) => {
    const packageJSONPath = pathfs.resolve(dir, 'package.json');
    const hasPackageJson = fse.existsSync(packageJSONPath);
    if (hasPackageJson) {
      const packageJSON = require(packageJSONPath);
      return {
        path: dir,
        packageJSON,
      };
    }
    return exploreDir(dir);
  })
  .flat()
  .filter((f) => !f.packageJSON.name.startsWith('@clabroche/docker'));

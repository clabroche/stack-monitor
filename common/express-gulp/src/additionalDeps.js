const pathfs = require('path');

const rootDir = pathfs.resolve(__dirname, '..', '..', '..');
const libs = [];
const fs = require('fs');
const { execSync } = require('child_process');

const getPkgJSON = (file) => {
  const pkgJSONPath = pathfs.resolve(file, 'package.json');
  let pkg;
  if (fs.existsSync(pkgJSONPath)) {
    pkg = require(pkgJSONPath);
  }
  return {
    file: () => pkg,
    name: () => pkg?.name,
    version: () => pkg?.version,
    allDependencies: () => Object.keys({ ...pkg?.dependencies, ...pkg?.devDependencies }),
    /** @param {string[]} alreadyDiscovered */
    correlateDependencies(alreadyDiscovered = []) {
      const libsName = libs.map((dep) => dep.name);
      const correlate = [];
      this.allDependencies()
        .filter((depName) => libsName.includes(depName) && !alreadyDiscovered.includes(depName))
        .forEach((depName) => {
          alreadyDiscovered.push(depName);
          const lib = libs.find((a) => a.name === depName);
          correlate.push(lib);
          correlate.push(...getPkgJSON(lib.path).correlateDependencies(alreadyDiscovered));
        });
      return correlate.reduce((_correlate, _pkg) => {
        if (!_correlate.includes(_pkg)) {
          _correlate.push(_pkg);
        }
        return _correlate;
      }, []);
    },
  };
};

execSync('yarn workspaces list --json', { encoding: 'utf-8' })
  .trim().split('\n')
  .map((_package) => JSON.parse(_package))
  .forEach((_package) => {
    const file = pathfs.resolve(rootDir, _package.location);
    libs.push({ name: _package.name, path: file });
  });

module.exports = {
  getAdditionalDeps: (dir) => getPkgJSON(dir).correlateDependencies(),
  getPkgJSON,
};

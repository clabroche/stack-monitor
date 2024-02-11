const pathfs = require('path');
const homedir = require('os').homedir();
const fse = require('fs-extra');
const { existsSync, mkdirSync } = require('fs');

const confDir = pathfs.resolve(homedir, '.stack-monitor');

/**
 * @param {string} file
 * @param {T} initialData
 * @param {{
 *  beforeSave?: (data: T) => void
 *  afterGet?: (data: T) => void
 * }} options
 * @template T
 */
function getSave(file, initialData, options = {}) {
  if (!existsSync(confDir)) mkdirSync(confDir);
  const dataConfPath = pathfs.resolve(confDir, file);
  if (!fse.existsSync(dataConfPath)) fse.writeJSONSync(dataConfPath, initialData);
  const data = fse.readJsonSync(dataConfPath);
  options?.afterGet?.(data);
  return {
    /** @type {T} */
    data,
    save() {
      options?.beforeSave?.(data);
      fse.writeJsonSync(dataConfPath, data);
    },
  };
}

module.exports = getSave;

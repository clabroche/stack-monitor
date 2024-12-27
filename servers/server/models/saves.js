const pathfs = require('path');
const homedir = require('os').homedir();
const {
  existsSync, mkdirSync, writeFileSync, readFileSync,
} = require('fs');

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
  if (!existsSync(dataConfPath)) writeFileSync(dataConfPath, JSON.stringify(initialData), 'utf-8');
  const data = JSON.parse(readFileSync(dataConfPath, 'utf-8'));
  options?.afterGet?.(data);
  return {
    /** @type {T} */
    data,
    save() {
      options?.beforeSave?.(data);
      writeFileSync(dataConfPath, JSON.stringify(data), 'utf-8');
    },
  };
}

module.exports = getSave;

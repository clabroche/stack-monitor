const { existsSync, readJsonSync } = require('fs-extra');
const path = require('path');

const file = {
  version: '0.0.0',
};
if (existsSync(path.resolve(__dirname, './package.json'))) {
  file.version = readJsonSync(path.resolve(__dirname, './package.json'), { encoding: 'utf-8' }).version;
} else if (existsSync(path.resolve(__dirname, '../package.json'))) {
  file.version = readJsonSync(path.resolve(__dirname, '../package.json'), { encoding: 'utf-8' }).version;
} else if (existsSync(path.resolve(__dirname, '../../../lerna.json'))) {
  file.version = readJsonSync(path.resolve(__dirname, '../../../lerna.json'), { encoding: 'utf-8' }).version;
}

module.exports = {
  version: file.version,
};

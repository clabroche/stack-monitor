const path = require('path');

module.exports = {
  rootPath: path.resolve(process.argv[2] || '.'),
  services: process.argv.slice(3).filter((a) => a),
};
console.log('Root path:', module.exports.rootPath)

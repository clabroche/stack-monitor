const path = require('path');

module.exports = {
  confPath: path.resolve(process.argv[2] || '.'),
  services: process.argv.slice(3).filter((a) => a),
};

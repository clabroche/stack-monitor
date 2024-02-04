const path = require('path');

module.exports = {
  ...require('@clabroche/common-jest/src/jest.config.default'),
  rootDir: path.resolve(__dirname),
};

const rfs = require('rotating-file-stream');

module.exports = (options) => {
  const {
    size, interval, maxFiles,
  } = options;
  return rfs.createStream(options.destination, {
    teeToStdout: true,
    size: size || '10M',
    interval: interval || '1d',
    maxFiles: maxFiles || 120,
  });
};

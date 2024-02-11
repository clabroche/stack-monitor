module.exports = {
  confPath: process.argv[2],
  services: process.argv.slice(3).join(' '),
};

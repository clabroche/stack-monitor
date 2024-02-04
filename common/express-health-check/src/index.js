/**
 * @param {import('express')} express
 * @param {{name?:string, version?:string}} param1
 * @returns
 */
module.exports = (express, { name = '', version = '' } = {}) => express.Router().use('/health', (req, res) => {
  res.json({
    name, version, health: true,
  });
});

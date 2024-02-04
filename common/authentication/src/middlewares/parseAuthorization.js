const jsonwebtoken = require('../helpers/jwt');

module.exports = (req, res, next) => {
  jsonwebtoken.parseAuthorization(req.headers.authorization);
  return next();
};

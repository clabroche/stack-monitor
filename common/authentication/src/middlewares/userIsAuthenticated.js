const jsonwebtoken = require('../helpers/jwt');

module.exports = (req, res, next) => {
  const jwt = jsonwebtoken.parseAuthorization(req.headers.authorization);
  if (jwt) return next();
  return res.status(401).json({ message: 'You are not logged' });
};

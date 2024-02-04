module.exports = {
  middlewares: {
    userIsAuthenticated: require('./middlewares/userIsAuthenticated'),
    parseAuthorization: require('./middlewares/parseAuthorization'),
  },
  ...require('./helpers/jwt'),
};

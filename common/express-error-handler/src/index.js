const HTTPError = require('@clabroche/common-express-http-error');
const logger = require('@clabroche/common-express-logger');
const errorCodes = require('./errorCodes');

module.exports = () => (err, req, res, next) => {
  const isValidCode = (
    (
      !Number.isNaN(Number(err.code)) || typeof err.code !== 'number'
    ) && errorCodes.map((a) => a.code).includes(Math.floor(+err.code))
  );
  let httpErr;
  if (err instanceof HTTPError && isValidCode) {
    httpErr = err;
  } else {
    httpErr = (!err.code || !isValidCode)
      ? new HTTPError(err, 500, err?.errorId, err?.date, err?.stack)
      : new HTTPError(err.message, err.code, err?.errorId, err?.date, err?.stack);
  }
  logger.error(httpErr);
  res.status(Math.floor(httpErr.code)).json({
    errorId: httpErr.errorId,
    date: httpErr.date,
    code: httpErr.code,
    message: httpErr.message,
    details: httpErr.details || err?.details,
    ...(err?.customCode ? { customCode: err.customCode } : {}),
  });
  next(err);
};

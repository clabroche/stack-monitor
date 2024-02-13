jest.mock('@clabroche/common-express-logger', () => {
  const mockError = {
    errorId: 'errorId',
    date: new Date(),
  };
  return {
    error: jest.fn().mockImplementation(() => mockError),
  };
});
const HTTPError = require('@clabroche/common-express-http-error');
const ErrorHandler = require('./index');

const mockRes = {
  status: jest.fn(() => mockRes),
  send: jest.fn(() => mockRes),
  json: jest.fn(() => mockRes),
};
beforeAll(() => { process.env.NODE_ENV = 'production'; });
afterAll(() => { process.env.NODE_ENV = 'test'; });

describe('Middleware: ErrorHandler', () => {
  it('should set 500 status and change message', async () => {
    const err = new HTTPError('This is an error');
    const errorHandler = ErrorHandler();
    errorHandler(err, {}, mockRes, () => { });
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: 500,
      errorId: err.errorId,
      date: err.date,
      message:
        'We cannot respond to your request for moment. Contact support for more information',
    });
  });
  it('should set 500 status when err.code is not valid', async () => {
    const err = new HTTPError('This is an error');
    err.code = 'this is not a valid code http';
    const errorHandler = ErrorHandler();
    errorHandler(err, {}, mockRes, () => { });
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: 500,
      errorId: err.errorId,
      date: err.date,
      message:
        'We cannot respond to your request for moment. Contact support for more information',
    });
  });
  it('should set 400 status with simple object', async () => {
    const err = new HTTPError('This is an error');
    err.code = 400;
    const errorHandler = ErrorHandler();
    errorHandler(err, {}, mockRes, () => { });
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: err.code,
      errorId: err.errorId,
      date: err.date,
      message: err.message,
    });
  });
  it('should set 400 status with HTTPErrror', async () => {
    const err = new HTTPError('This is an error', 400);
    const errorHandler = ErrorHandler();
    errorHandler(err, {}, mockRes, () => { });
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: err.code,
      errorId: err.errorId,
      date: err.date,
      message: err.message,
    });
  });
});

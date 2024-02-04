const middleware404 = require('./index');

const mockRes = {
  status: jest.fn(() => mockRes),
  send: jest.fn(() => mockRes),
};

describe('Middleware: 404', () => {
  it('should set 404 status', async () => {
    middleware404({}, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });
});

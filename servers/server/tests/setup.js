const supertest = require('supertest');
const  util = require('util');

// @ts-ignore
const Test = supertest.Test

Object.defineProperties(Test.prototype, {
  _assert: {
    value: Test.prototype.assert,
  },
  assert: {
    value: function (resError, res, fn) {
      this._assert(resError, res, (err, res) => {
        if (err) {
          const originalMessage = err.message;
          err.message = `${err.message}\nStatus: ${res.status}\nResponse: ${util.inspect(res.body, { depth: null, colors: true, compact: false })}\nText: ${res.text}`;
          // Must update the stack trace as what supertest prints is the stacktrace
          err.stack = err.stack?.replace(originalMessage, err.message);
        }
        fn.call(Test.prototype.assert, err, res);
      });
    }
  }
});
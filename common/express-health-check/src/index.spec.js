const express = require('express');
const supertest = require('supertest');
const middleware = require('./index');

describe('Middleware: healthcheck', () => {
  it('should send a healthcheck', async () => {
    const health = middleware(express, ({ name: 'toto', version: 'titi' }));
    const app = express();
    app.use(health);
    const { body } = await supertest(app).get('/health').send();
    expect(body).toEqual({ name: 'toto', version: 'titi', health: true });
  });
});

const express = require('express');
const request = require('supertest');
const PromiseB = require('bluebird');
const nodeCls = require('./index');

describe('Auth', () => {
  it('shouldwork', (done) => {
    nodeCls.init(() => {
      nodeCls.setItem('test', '123');
      const res = nodeCls.getItem('test');
      expect(res).toBe('123');
      done();
    });
  });
  it('should get correct jwt with node cls core implementation', async () => {
    const server = request(getServerWithCoreNodeCls());
    const test1 = await PromiseB.map([server.get('/jwt'), server.get('/jwt2')], (res) => res.body);
    const test2 = await PromiseB.map([server.get('/jwt2'), server.get('/jwt')], (res) => res.body);
    expect(test1).toEqual([{ id: 'jwt', value: 'jwt' }, { id: 'jwt2', value: 'jwt2' }]);
    expect(test2).toEqual([{ id: 'jwt2', value: 'jwt2' }, { id: 'jwt', value: 'jwt' }]);
  });
  it('should get correct jwt with wrapper for express', async () => {
    const server = request(getServerWithWrapper());
    const test1 = await PromiseB.map([
      server.get('/jwt').set('authorization', 'jwt1'),
      server.get('/jwt2').set('authorization', 'jwt2'),
    ], (res) => res.body);
    const test2 = await PromiseB.map([
      server.get('/jwt2').set('authorization', 'jwt2'),
      server.get('/jwt').set('authorization', 'jwt1'),
    ], (res) => res.body);
    expect(test1).toEqual([{ id: 'jwt1', value: 'jwt1' }, { id: 'jwt2', value: 'jwt2' }]);
    expect(test2).toEqual([{ id: 'jwt2', value: 'jwt2' }, { id: 'jwt1', value: 'jwt1' }]);
  });
  it('should crud', (done) => {
    nodeCls.init(() => {
      nodeCls.setItem('ppp', 'aaa');
      expect(nodeCls.getItem('ppp')).toBe('aaa');
      nodeCls.removeItem('ppp');
      expect(nodeCls.getItem('ppp')).toBe(undefined);
      done();
    });
  });

  it('should make available an id', (done) => {
    nodeCls.init(() => {
      const a = nodeCls.getItem('id');
      expect(a).toHaveLength(36);
      done();
    });
  });
});

function getServerWithCoreNodeCls() {
  const app = express();
  const fct = async () => {
    const jwt = nodeCls.getItem('jwt');
    return jwt;
  };
  app.use(nodeCls.init);
  app.get('/jwt', async (req, res) => {
    nodeCls.setItem('jwt', 'jwt');
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    res.send({ id: 'jwt', value: await fct() });
  });
  app.get('/jwt2', async (req, res) => {
    nodeCls.setItem('jwt', 'jwt2');
    await new Promise((resolve) => { setTimeout(resolve, 10); });
    res.send({ id: 'jwt2', value: await fct() });
  });
  return app;
}

function getServerWithWrapper() {
  const app = express();
  const fct = async () => nodeCls.getItem('jwt');
  app.use(nodeCls.init);
  app.get('/jwt', async (req, res) => {
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    nodeCls.setItem('jwt', req.headers.authorization);
    res.send({ id: 'jwt1', value: await fct() });
  });
  app.get('/jwt2', async (req, res) => {
    nodeCls.setItem('jwt', req.headers.authorization);
    await new Promise((resolve) => { setTimeout(resolve, 10); });
    res.send({ id: 'jwt2', value: await fct() });
  });
  return app;
}

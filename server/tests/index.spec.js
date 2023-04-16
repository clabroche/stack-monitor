const request = require("supertest");
const pathfs = require('path');

const confsPathTests = {
  array: pathfs.resolve(__dirname, 'testFiles', 'stackArray.js'),
  object: pathfs.resolve(__dirname, 'testFiles', 'stackObject.js'),
  function: pathfs.resolve(__dirname, 'testFiles', 'stackFunction.js'),
}

function getModules() {
  jest.resetModules()
  return {
    app: require('../app'),
    args: require("../helpers/args"),
    Stack: require("../models/stack"),
  }
}
afterEach(async ()=> {
  const { stopWorkers } = require('../app')
  await stopWorkers()
})
describe('Test', () => {
  describe('no params', () => {
    it('should get stack null', async () => {
      const { app } = getModules()
      const { body } = await request(app).get("/stack");
      expect(body).toEqual(null)
    })
    it('should get services []', async () => {
      const { app } = getModules()
      const { body } = await request(app).get("/stack/services");
      expect(body).toEqual([])
    })
  })
  describe('Check retrocompatibility format', () => {
    it('should load service on array format', async () => {
      const { app, Stack } = getModules()
      await Stack.selectConf(confsPathTests.array);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.array)
      expect(Stack.getStack()?.services).toHaveLength(1)
    })
    it('should load service on object format', async () => {
      const { app, Stack } = getModules()
      await Stack.selectConf(confsPathTests.object);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.object)
      expect(Stack.getStack()?.services).toHaveLength(1)
      expect(Stack.getStack()?.watchFiles).toHaveLength(1)
    })
    it('should load service on function format', async () => {
      const { app, Stack } = getModules()
      await Stack.selectConf(confsPathTests.function);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.function)
      expect(Stack.getStack()?.services).toHaveLength(1)
      expect(Stack.getStack()?.watchFiles).toHaveLength(1)
    })
  })

  describe('/choose', () => {
    it('should throw err on empty payload', async () => {
      const { app } = getModules()
      await request(app).post("/stack/choose")
        .expect(400, 'you should provide an array as body with all service label you want to launch');
    })

    it('should choose when Array in payload is empty', async () => {
      const { app } = getModules()
      await request(app).post("/stack/choose")
        .send([])
        .expect(200);
    })
  })
})
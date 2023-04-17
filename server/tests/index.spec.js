const request = require("supertest");
const pathfs = require('path');

const confsPathTests = {
  array: pathfs.resolve(__dirname, 'testFiles', 'stackArray.js'),
  object: pathfs.resolve(__dirname, 'testFiles', 'stackObject.js'),
  function: pathfs.resolve(__dirname, 'testFiles', 'stackFunction.js'),
}
const wait = (ms) => new Promise(res => setTimeout(res, ms));
function getModules() {
  jest.resetModules()
  const { stopWorkers } = require('../app')
  return {
    app: require('../app'),
    args: require("../helpers/args"),
    Stack: require("../models/stack"),
    stopWorkers
  }
}
describe('Test', () => {
  describe('no params', () => {
    it('should get stack null', async () => {
      const { app, stopWorkers } = getModules()
      const { body } = await request(app).get("/stack");
      expect(body).toEqual(null)
      await stopWorkers()
    })
    it('should get services []', async () => {
      const { app, stopWorkers } = getModules()
      const { body } = await request(app).get("/stack/services");
      expect(body).toEqual([])
      await stopWorkers()
    })
  })
  describe('Check retrocompatibility format', () => {
    it('should load service on array format', async () => {
      const { app, Stack, stopWorkers } = getModules()
      await Stack.selectConf(confsPathTests.array);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack()?.exportInApi())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.array)
      expect(Stack.getStack()?.services).toHaveLength(require('./testFiles/services').length)
      await stopWorkers()
    })
    it('should load service on object format', async () => {
      const { app, Stack, stopWorkers } = getModules()
      await Stack.selectConf(confsPathTests.object);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack()?.exportInApi())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.object)
      expect(Stack.getStack()?.services).toHaveLength(require('./testFiles/services').length)
      expect(Stack.getStack()?.watchFiles).toHaveLength(require('./testFiles/stack').watchFiles?.length || 0)
      await stopWorkers()
    })
    it('should load service on function format', async () => {
      const { app, Stack, stopWorkers } = getModules()
      await Stack.selectConf(confsPathTests.function);
      const { body } = await request(app).get("/stack");
      expect(Stack.getStack()).not.toBeNull()
      expect(body).toEqual(Stack.getStack()?.exportInApi())
      expect(Stack.getStack()?.confPath).toEqual(confsPathTests.function)
      expect(Stack.getStack()?.services).toHaveLength(require('./testFiles/services').length)
      expect(Stack.getStack()?.watchFiles).toHaveLength(require('./testFiles/stack').watchFiles?.length || 0)
      await stopWorkers()
    })
  })

  describe('/choose', () => {
    it('should throw err on empty payload', async () => {
      const { app, stopWorkers } = getModules()
      await request(app).post("/stack/choose")
        .expect(400, 'you should provide an array as body with all service label you want to launch');
      await stopWorkers()
    })
    it('should throw error if stack is not select before launch', async () => {
      const { app, stopWorkers } = getModules()
      await request(app).post("/stack/choose")
        .send([])
        .expect(500)
      await stopWorkers()
    })
    it('should choose when Array in payload is empty', async () => {
      const { app, Stack, stopWorkers } = getModules()
      await Stack.selectConf(confsPathTests.function);
      await request(app).post("/stack/choose")
        .send([])
        .expect(200, [])
      await stopWorkers()
    })
  })
  describe('Scenario', () => {
    /** @type {ReturnType<typeof getModules>} */
    let modules
    beforeAll(async() => {
      modules = getModules()
      await modules.Stack.selectConf(confsPathTests.function);
    })
    afterAll(async () => {
      await modules.stopWorkers()
    })
    it('should launch server', async () => {
      const {app, Stack} = modules
      const chooseApiReturn = await request(app).post("/stack/choose")
        .send(['Server'])
        .expect(200)
      expect(chooseApiReturn.body).toHaveLength(1)
      expect(chooseApiReturn.body).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Server' })]))
      expect(Stack.findService('Server').pids).toHaveLength(1)
      await wait(200)
      expect(Stack.findService('Server').store).toEqual('server\n')
      expect(chooseApiReturn.body[0]).not.toHaveProperty('pids')
      expect(chooseApiReturn.body[0]).not.toHaveProperty('store')
    })
    it('should not export pids and store of services in api', async() => {
      const { app, Stack } = modules
      const stackFromApi = await request(app).get("/stack")
        .expect(200)
      expect(stackFromApi.body).toHaveProperty('services')
      expect(stackFromApi.body.services[0]).not.toHaveProperty('pids')
      expect(stackFromApi.body.services[0]).not.toHaveProperty('store')
      const servicesFromApi = await request(app).get("/stack/services")
        .expect(200)
      expect(servicesFromApi.body).toHaveLength(require('./testFiles/services').length)
      expect(servicesFromApi.body[0]).not.toHaveProperty('pids')
      expect(servicesFromApi.body[0]).not.toHaveProperty('store')
      const serviceFromApi = await request(app).get("/stack/Server")
        .expect(200)
      expect(serviceFromApi.body.label).toEqual('Server')
      expect(serviceFromApi.body).not.toHaveProperty('pids')
      expect(serviceFromApi.body).not.toHaveProperty('store')
    })
  })
})

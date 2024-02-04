const Stack = require('./stack')
const Service = require('./Service')
describe('Service', () => {
  describe('#parseIncoming', () => {
    // @ts-ignore
    const service = new Service({}, {...new Stack({})})
    it('All in cmd args', () => {
      expect(service.parseIncomingCommand('sh -c "echo coucou"')).toEqual(expect.objectContaining({
        cmd: 'sh',
        args: ['-c "echo coucou"'],
      }))
    })
    it('all in one arg', () => {
      expect(service.parseIncomingCommand('sh', ['-c "echo coucou"'])).toEqual(expect.objectContaining({
        cmd: 'sh',
        args: ['-c "echo coucou"'],
      }))
    })
    it('all in multiple args', () => {
      expect(service.parseIncomingCommand('sh', ['-c', 'echo coucou'])).toEqual(expect.objectContaining({
        cmd: 'sh',
        args: ['-c', 'echo coucou'],
      }))
    })
    it('should set shell to /bin/sh', () => {
      expect(service.parseIncomingCommand('sh', ['-c', 'echo coucou'])).toEqual(expect.objectContaining({
        options: expect.objectContaining({
          shell: '/bin/sh'
        })
      }))
    })
    it('should load current environnment', () => {
      expect(service.parseIncomingCommand('sh', ['-c', 'echo coucou'])).toEqual(expect.objectContaining({
        options: expect.objectContaining({
          env: expect.objectContaining(process.env)
        })
      }))
    })
    it('should load custom environnment', () => {
      // @ts-ignore
      const service = new Service({spawnOptions: {}}, {...new Stack({})})
      expect(service.parseIncomingCommand('sh', ['-c', 'echo coucou'], {env: {
        hello: 'world'
      }})).toEqual(expect.objectContaining({
        options: expect.objectContaining({
          env: expect.objectContaining({
            ...process.env,
            hello: 'world'
          })
        })
      }))
    })
  })
})
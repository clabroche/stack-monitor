const Service = require('./Service');
const EncryptionKey = require('./EncryptionKey');
const args = require('../helpers/args');
const path = require('path');
const { rmSync } = require('fs');
const Environment = require('./Environment');


beforeAll(async () => {
  args.rootPath = path.resolve(__dirname)
  rmSync(path.resolve(args.rootPath, '.stackmonitor'), { force: true, recursive: true })
  const key = await EncryptionKey.generateKey()
  await EncryptionKey.saveKey(key, {noReload: true})
})
afterAll(async() => {
  rmSync(path.resolve(args.rootPath, '.stackmonitor'), { force: true, recursive: true })
})
function getService(spawnOptions) {
  return {
    commands: [
      { id: '1234', spawnCmd: 'echo', spawnArgs: ['hello'], spawnOptions }
    ]
  }
}
describe('Service', () => {
  it('check envs', async () => {
    await new Environment({
      label: 'local',
      envs: {
        sameValue: 'sameValueForLocal',
        localValue: 'localValue',
        localValueOverride: 'localValueOverride',
        localValueOverride_STACK_MONITOR_OVERRIDE: 'localValueOverride_STACK_MONITOR_OVERRIDE',
      },
    }).save()
    await new Environment({
      label: 'dev',
      extends: ['local'],
      envs: {
        sameValue: 'sameValueForDev',
        devValue: 'devValue',
      },
    }).save()
    const spawnOptions = {
      envs: {
        local: {
          envs: [
            { key: 'rawValue', value: 'rawValue' },
            { key: 'sameValue', value: '{{sameValue}}' },
            { key: 'rawOverride', value: 'rawValue', override: 'rawOverride' },
            { key: 'localValue', value: '{{localValue}}' },
            { key: 'localValueOverride', value: '{{localValueOverride}}', override: '{{localValueOverride_STACK_MONITOR_OVERRIDE}}', },
            { key: 'localValueOverrideWithPrefixSuffix', value: '{{localValueOverride}}', override: '{{localValueOverride_STACK_MONITOR_OVERRIDE}}', prefix: 'prefix/', suffix: '/suffix' },
            { key: 'localValueWithPrefixSuffix', value: '{{localValue}}', prefix: 'prefix/', suffix:'/suffix' },
            { key: 'devValue', value: '{{devValue}}' },
          ], extends: []
        },
        dev: {
          envs: [
            { key: 'rawValue', value: 'rawValueForDev' },
            { key: 'devValue', value: '{{devValue}}' },
            { key: 'sameValue', value: '{{sameValue}}' },
          ], extends: []
        }
      }
    }
    const service = await new Service(getService(spawnOptions), {})
    const resForLocal = await service.buildEnvs('local', spawnOptions)
    const resForDev = await service.buildEnvs('dev', spawnOptions)
    expect(resForLocal.rawValue).toEqual('rawValue')
    expect(resForLocal.rawOverride).toEqual('rawOverride')
    expect(resForLocal.localValue).toEqual('localValue')
    expect(resForLocal.localValueOverride).toEqual('localValueOverride_STACK_MONITOR_OVERRIDE')
    expect(resForLocal.devValue).toEqual(undefined)
    expect(resForLocal.localValueWithPrefixSuffix).toEqual('prefix/localValue/suffix')
    expect(resForLocal.localValueOverrideWithPrefixSuffix).toEqual('prefix/localValueOverride_STACK_MONITOR_OVERRIDE/suffix')
    expect(resForLocal.sameValue).toEqual('sameValueForLocal')

    expect(resForDev.rawValue).toEqual('rawValueForDev')
    expect(resForDev.devValue).toEqual('devValue')
    expect(resForDev.localValue).toEqual('localValue') // Not exists in dev but herits from local
    expect(resForDev.localValueWithPrefixSuffix).toEqual('prefix/localValue/suffix') // Not exists in dev but herits from local
    expect(resForDev.localValueOverrideWithPrefixSuffix).toEqual('prefix/localValueOverride_STACK_MONITOR_OVERRIDE/suffix') // Not exists in dev but herits from local
    expect(resForDev.sameValue).toEqual('sameValueForDev')
    service.stopQueue = true
  })

});

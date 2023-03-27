const path = require('path')
let stack = []
const { watch } = require('fs')
const debounce = require('debounce')
const _ = require('lodash')
const { cloneDeep } = require('lodash')
const Socket = require('./socket')
const helpers = require('../helpers/services')
const { killService, launchService } = require('../helpers/services')
const myConfs = require('./myConfs')
const fs = require('fs')
const pathfs = require('path')
let originalStack = { value: null }
let currentWatches = []

const checkConf = debounce(async (originalStack, confPath, path) => {
  delete require.cache[require.resolve(confPath)]
  if(path && path.endsWith('.js')) delete require.cache[require.resolve(path)]

  const newConf = require(confPath)?.stack || require(confPath)
  const reduce = (conf, service) => {
    conf[service.label] = service
    return conf
  }
  const oldConfObject = originalStack.value.reduce(reduce, {})
  const newConfObject = newConf.reduce(reduce, {})
  const differenceConf = difference(newConfObject, oldConfObject)
  const updatedServices = Object.keys(differenceConf).reduce((keys, key) => {
    const serviceName = key.split('.').shift()
    if (!keys.includes(serviceName)) keys.push(serviceName)
    return keys
  }, [])
  updatedServices.forEach(label => {
    const index = stack.findIndex((service) => service.label === label)
    const oldService = stack.find((service) => service.label === label)
    const newService = newConf.find((service) => service.label === label)
    if (oldService && oldService.enabled) {
      console.log('Reload Service', newService.label)
      killService(oldService).then(() => launchService(newService))
    }
    if (index !== -1 && newService) {
      stack.splice(index, 1, newService)
    }
  })
  Socket.socket.emit('conf:update', updatedServices)
  originalStack.value = cloneDeep(newConf)
}, 100, false)

module.exports = {
  stack,
  async selectConf(pathToConf, _services) {
    let services = await Promise.resolve().then(() => {
      return JSON.parse(_services)
    }).catch((err) => {
      return []
    })
    if (currentWatches?.length) currentWatches.forEach(currentWatch => currentWatch.close())
    const confPath = path.resolve(pathToConf)
    await myConfs.add(confPath)
    const rawStack = confPath ? require(confPath) : []
    stack = Array.isArray(rawStack) ? rawStack : rawStack.stack // Support for old stack files
    this.stack = stack
    originalStack.value = cloneDeep(this.stack)
    const file = fs.readFileSync(confPath, 'utf-8')
    const filesToWatch = [
      ...file.matchAll(new RegExp(`require\\((.*)\\)`, 'gi'))
    ].map(a => a[1])
      .filter(path => path.charAt(1) === '.')
      .map(file => {
        return pathfs.resolve(confPath, '..', file.replaceAll(`'`, '').replaceAll(`"`, ''))
      })
    ;[
      ...rawStack.watchFiles || [],
      confPath
    ].forEach(file => {
      if (fs.existsSync(file)) currentWatches.push(watch(file, () => checkConf(originalStack, confPath, file)))
      else console.error(file, 'not exists')
    })
    if(services?.length) {
      this.stack.forEach(stackService => {
        if(services.includes(stackService.label)) {
          stackService.enabled = true
        } else {
          stackService.enabled = false
        }
      });
    } 
  },
  getStack() {
    return stack
  },
  findService(serviceLabel) {
    return stack.filter(s => s.label === serviceLabel)[0]
  },
  launch() {
    stack.forEach(microservice => {
      microservice.store = ''
      if (microservice.enabled) {
        helpers.launchService(microservice)
      }
    })
  },
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} fromObject Object compared
 * @param  {Object} toObject   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(fromObject, toObject) {
  const changes = {}
  const buildPath = (_path, key) => _.isUndefined(_path) ? key : `${_path}.${key}`
  const walk = (_fromObject, _toObject, _path) => {
    for (const key of _.keys(_fromObject)) {
      const currentPath = buildPath(_path, key)
      if (!_.has(_toObject, key)) {
        changes[currentPath] = { from: _.get(_fromObject, key) }
      }
    }
    for (const [key, to] of _.entries(_toObject)) {
      const currentPath = buildPath(_path, key)
      if (!_.has(_fromObject, key)) {
        changes[currentPath] = { to }
      } else {
        const from = _.get(_fromObject, key)
        if (!_.isEqual(from, to)) {
          if (_.isObjectLike(to) && _.isObjectLike(from)) {
            walk(from, to, currentPath)
          } else {
            changes[currentPath] = { from, to }
          }
        }
      }
    }
  }
  walk(fromObject, toObject)
  return changes
}

if (process.argv[2]) {
  module.exports.selectConf(process.argv[2], process.argv.slice(3).join(' '))
    .catch(console.error)
}

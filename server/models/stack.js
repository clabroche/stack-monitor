const path = require('path')
let stack = [];
const { watch } = require('fs');
const debounce = require('debounce');
const _ = require('lodash');
const { cloneDeep } = require('lodash');
const Socket = require('./socket');
const helpers = require('../helpers/services');
const {killService, launchService} = require('../helpers/services');
let originalStack = {value: null}
try {
  if(process.argv[2]) {
    const confPath = path.resolve(process.argv[2]) 
    stack = confPath ? require(confPath) : []
    originalStack.value = cloneDeep(stack)
    watch(confPath, debounce(async () => {
      delete require.cache[require.resolve(confPath)]
      const newConf = require(confPath)
      const reduce = (conf, service) => {
        conf[service.label] = service
        return conf
      }
      const oldConfObject = originalStack.value.reduce(reduce, {})
      const newConfObject = newConf.reduce(reduce, {})
      const differenceConf = difference(newConfObject, oldConfObject )
      const updatedServices = Object.keys(differenceConf).reduce((keys, key) => {
        const serviceName = key.split('.').shift()
        if(!keys.includes(serviceName)) keys.push(serviceName)
        return keys
      }, [])
      updatedServices.forEach(label => {
        const index = stack.findIndex((service) => service.label === label)
        const oldService = stack.find((service) => service.label === label)
        const newService = newConf.find((service) => service.label === label)
        killService(oldService).then(() => launchService(newService))
        if(index !== -1 && newService) {
          stack.splice(index, 1, newService)
        }
      })
      Socket.socket.emit('conf:update', updatedServices)
      originalStack.value = cloneDeep(newConf)
    }, 100))
  } else {
    console.error('Provide path to config as argument')
    process.exit(1)
  }
} catch (error) {
  throw new Error(path.resolve(process.argv[2]) + ' not found')
}

module.exports = {
  stack,
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
  const changes = {};

  const buildPath = (_path, obj, key) =>
    _.isUndefined(_path) ? key : `${_path}.${key}`;

  const walk = (_fromObject, _toObject, _path) => {
    for (const key of _.keys(_fromObject)) {
      const currentPath = buildPath(_path, _fromObject, key);
      if (!_.has(_toObject, key)) {
        changes[currentPath] = { from: _.get(_fromObject, key) };
      }
    }

    for (const [key, to] of _.entries(_toObject)) {
      const currentPath = buildPath(path, _toObject, key);
      if (!_.has(_fromObject, key)) {
        changes[currentPath] = { to };
      } else {
        const from = _.get(_fromObject, key);
        if (!_.isEqual(from, to)) {
          if (_.isObjectLike(to) && _.isObjectLike(from)) {
            walk(from, to, currentPath);
          } else {
            changes[currentPath] = { from, to };
          }
        }
      }
    }
  };

  walk(fromObject, toObject);

  return changes;
}
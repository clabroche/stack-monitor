const path = require('path')
const { watch } = require('fs')
const debounce = require('debounce')
const _ = require('lodash')
const Socket = require('./socket')
const myConfs = require('./myConfs')
const fs = require('fs')
const Service = require('./Service')
const PromiseB = require('bluebird')
const dot = require('dot-object')
const pathfs = require('path')

class Stack {
  /**@type {Stack | null} */
  static #currentStack = null
  /**@type {fs.FSWatcher[]} */
  static #currentWatches = []
  /**@type {string} */
  static #currentEnvironment = ''
  /**@type {() => undefined} */
  static #onLaunchCallback = () => { }
  /**@type {(service: Service) => undefined} */
  static #onServiceRestart = () => { }
  /**@type {(service: Service) => undefined} */
  static #onServiceStart = () => { }
  /**@type {(service: Service) => undefined} */
  static #onServiceKill = () => { }
  /**@type {GlobalScript[]} */
  static #globalScripts = []

  static devops = {
    /** @param {GlobalScript} script */
    addGlobalScript(script) {
      Stack.#globalScripts.push(script)
    },
    getGlobalScripts() {
      return Stack.#globalScripts
    }
  }

  /** @param {Partial<Stack>} stack */
  constructor(stack) {
    /** @type {string | undefined} */
    this.confPath = stack.confPath
    /** @type {string[]} */
    this.watchFiles = stack.watchFiles || []
    /** @type {Service[]} */
    this.services = (stack?.services || []).map(service => new Service(service))
  }

  /** @param {string[]} servicesLabelSelected */
  enable(servicesLabelSelected) {
    this.getServices().forEach(service => {
      if (servicesLabelSelected.includes(service.label)) {
        service.enable()
      }
    })
  }

  async restart() {
    await PromiseB.map(await this.getEnabledServices(), (service) => {
      return service.restart()
    })
  }
  async kill() {
    await PromiseB.map(await this.getEnabledServices(), (service) => {
      return service.kill()
    })
  }
  static getCurrentEnvironment() {
    return Stack.environments?.[this.#currentEnvironment]
  }

  exportForDifference() {
    return {
      watchFiles: this.watchFiles,
      services: this.services.map(s => s.exportForDifference())
    }
    
  }
  /**
   * 
   * @param {string} confPath 
   * @param {typeof Stack} injection 
   * @returns 
   */
  static async parse(confPath, injection) {
    delete require.cache[require.resolve(confPath)]
    let rawStack
    try {
      rawStack = confPath ? require(confPath) : []
    } catch (error) {
      // Because sometimes require failed on reload
      rawStack = confPath ? require(confPath) : []
    }
      if (Array.isArray(rawStack)) {
        return new Stack({ services: rawStack, confPath })
      } else if (typeof rawStack === 'function') {
        const stack = await rawStack(injection)
        return new Stack({
          ...stack,
          confPath,
          services: stack.services || stack.stack,
        })
      } else {
        return new Stack({
          ...rawStack,
          confPath,
          services: rawStack.services || rawStack.stack,
        })
      }
  }


  launch() {
    this.getServices().forEach(microservice => {
      if (microservice.enabled) {
        microservice.launch()
      }
    })
    Stack.#onLaunchCallback()
  }
  static getStack() {
    return Stack.#currentStack
  }

  static getServices() {
    return Stack.#currentStack?.services || []
  }
  getServices() {
    return Stack.getServices()
  }

  static getEnabledServices() {
    return Stack.getServices().filter(s => s.enabled)
  }
  getEnabledServices() {
    return Stack.getEnabledServices()
  }

  exportInApi() {
    const res = {...this}
    res.services = res.services?.map(s => s.exportInApi())
    return res
  }

  /**
   * 
   * @param {string} serviceLabel 
   * @returns 
   */
  static findService(serviceLabel) {
    return Stack.getServices().filter(s => s.label === serviceLabel)[0]
  }
  /**
   * 
   * @param {string} serviceLabel 
   * @returns 
   */
  findService(serviceLabel) {
    return Stack.findService(serviceLabel)
  }

  
  /**
   * 
   * @param {string} confPath 
   * @param {string[]} _services 
   */
  static async selectConf(confPath, _services = []) {
    confPath = pathfs.resolve(confPath);
    // let services = await Promise.resolve()
    //   .then(() => JSON.parse(_services))
    //   .catch((err) => ([]))
    if (Stack.#currentWatches?.length) Stack.#currentWatches.forEach(currentWatch => currentWatch.close())
    confPath = path.resolve(confPath)
    await myConfs.add(confPath)
    Stack.#currentStack = await this.parse(confPath, this) 
    ;[
      ...(Stack.#currentStack?.watchFiles || []),
      confPath
    ].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        Stack.#currentWatches.push(
          watch(filePath, async () => {
            checkConfDebounce(filePath)
          })
        )
      }
      else console.error(filePath, 'not exists')
    })
  }
  /**
   * @template {Record<string, Environment>} T 
   * @param { T | undefined } env 
   * @param {keyof T & string} defaultEnvironment 
   * @returns {never}
   */
  static setEnvironments(env, defaultEnvironment) {
    if(!this.#currentEnvironment) this.#currentEnvironment = defaultEnvironment
    if (JSON.stringify(this.environments) === JSON.stringify(env)) return /** @type {never}*/(this.environments?.[this.#currentEnvironment]?.envs)
    this.environments = env
    console.log('Environment changed, reload page...')
    Socket.io?.emit('forceReload')
    return /** @type {never}*/(this.environments?.[this.#currentEnvironment]?.envs)
  }

  /**
   * 
   * @param {string} envLabel 
   */
  async changeEnvironment(envLabel) {
    if (Stack.environments?.[envLabel]) {
      Stack.#currentEnvironment = envLabel
      const enabledServices = await Stack.getEnabledServices()
      await Stack.getStack()?.kill()
      enabledServices.forEach(s => {
        s.enabled = true
        s.store = ''
      })
      const stack = Stack.getStack()
      if(stack?.confPath) {
        await checkConf(stack.confPath)
      }
      await Stack.getStack()?.launch()

    } else {
      throw new Error('env not found')
    }
  }

  /** @param {() => undefined} cb  */
  static onLaunch(cb) {
    this.#onLaunchCallback = cb
  }
  triggerOnLaunch() {
    return Stack.#onLaunchCallback()
  }
  /** @param {(service: Service) => undefined} cb  */
  static onServiceRestart(cb) {
    this.#onServiceRestart = cb
  }
  /** @param  {Service} service */
  triggerOnServiceRestart(service) {
    return Stack.#onServiceRestart(service)
  }
  /** @param {(service: Service) => undefined} cb  */
  static onServiceStart(cb) {
    this.#onServiceStart = cb
  }
  /** @param  {Service} service */
  triggerOnServiceStart(service) {
    return Stack.#onServiceStart(service)
  }
  /** @param {(service: Service) => undefined} cb  */
  static onServiceKill(cb) {
    this.#onServiceKill = cb
  }
  /** @param  {Service} service */
  triggerOnServiceKill(service) {
    return Stack.#onServiceKill(service)
  }
  static stopWatchers() {
    Stack.#currentWatches.forEach(currentWatch => currentWatch.close())
  }
}

module.exports = Stack

/**
 * @param {Stack} originalStack
 * @param {Stack} newStack
 */
async function reloadService(originalStack, newStack) {
  const newData = newStack.exportForDifference()
  const updatedServices = originalStack.services.filter(originalService => {
    const newService = newData.services.find(s => s.label === originalService.label)
    if (newService?.label) {
      const diffs = difference(originalService.exportForDifference(), newService)
      if (!Object.keys(diffs)?.length) return false
      let shouldRestart = false
      Object.keys(diffs).forEach(key => {
        if (key.includes('spawnOptions.shell')) return // spawnOptions.shell is set by stack-monitor not user 
        // @ts-ignore
        dot.copy('to', key, diffs[key], originalService)
        shouldRestart = true
      })
      return shouldRestart
    }
    console.log('Changes not taken. Please restart stack-monitor...')
    return false
  })

  Socket.io?.emit('conf:update', updatedServices.map(s => s.label))
  await PromiseB.map(updatedServices, async service => {
    if (service.pids?.length) {
      console.log('Restart', service.label)
      await service.restart()
    }
  })
}
/**
 * @param {Stack} originalStack
 * @param {Stack} newStack
 */
async function reloadGloblalConf(originalStack, newStack) {
  const diffs = difference(
    { ...originalStack.exportForDifference(), services: []},
    { ...newStack.exportForDifference(), services: [] }
  )
  if (!Object.keys(diffs)?.length) return false
  Object.keys(diffs).forEach(key => {
    // @ts-ignore
    dot.copy('to', key, diffs[key], originalStack)
  })
  console.log('Global changes, restart all...')
  await originalStack.restart()
  Socket.io?.emit('forceReload')
}

/**
 * @param {string} path
 */
const checkConf = async (path = '') => {
  try {
    if (path && path.endsWith('.js')) delete require.cache[require.resolve(path)]
    const originalStack = Stack.getStack()
    if (!originalStack?.confPath) return 
    const newStack = await Stack.parse(originalStack.confPath, Stack)
    if (!newStack) return
    await reloadService(originalStack, newStack)
    await reloadGloblalConf(originalStack, newStack)
  } catch (error) {
    console.error(error)
  }
}
const checkConfDebounce = debounce(
  checkConf,
  100,
  false
)

/**
 * Deep diff between two object, using lodash
 * @param  {Object} fromObject Object compared
 * @param  {Object} toObject   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(fromObject, toObject) {
  const changes = {}
  const buildPath = (/** @type {any} */ _path, /** @type {string} */ key) => _.isUndefined(_path) ? key : `${_path}.${key}`
  const walk = (/** @type {Object} */ _fromObject, /** @type {Object | undefined} */ _toObject, /** @type {string | undefined} */ _path) => {
    for (const key of _.keys(_fromObject)) {
      const currentPath = buildPath(_path, key)
      if (!_.has(_toObject, key)) {
        // @ts-ignore
        changes[currentPath] = { from: _.get(_fromObject, key) }
      }
    }
    for (const [key, to] of _.entries(_toObject)) {
      const currentPath = buildPath(_path, key)
      if (!_.has(_fromObject, key)) {
        // @ts-ignore
        changes[currentPath] = { to }
      } else {
        const from = _.get(_fromObject, key)
        if (!_.isEqual(from, to)) {
          if (_.isObjectLike(to) && _.isObjectLike(from)) {
            walk(from, to, currentPath)
          } else {
            // @ts-ignore
            changes[currentPath] = { from, to }
          }
        }
      }
    }
  }
  walk(fromObject, toObject)
  return changes
}


/**
 * @typedef {Omit<import('../../typings/index').NonFunctionProperties<Service>, 'pids' | 'store' | 'enabled'>[]} StackArray
 */

/**
 * @typedef {{
 * watchFiles?: string[],
 * stack?: StackArray,
 * services?: StackArray,
 * }} StackObject
 */


/**
 * @typedef {(stackMonitor: typeof Stack) => StackObject | Promise<StackObject>} StackFunction
 */

/**
 * @typedef {StackArray | StackObject | StackFunction} StackFile
 */

/**
 * @typedef {{
 *  label: string,
 *  envs: Record<string, any>,
 *  color?: string,
 *  bgColor?: string
 * }} Environment
 */

/**
 * @typedef {{
 *  label: string,
 *  pipeline: {
 *    label: string,
 *    id: string,
 *    prompt?:{
 *      question: string,
 *      options?: (output: Record<string, any>) => ({label: string, value: string}[]) | Promise<{label: string, value: string}[]>,
 *      defaultValue?: (output: Record<string, any>) => any,
 *      type?: 'string' | 'number' | 'boolean' | 'array' | 'select'| 'multi-select',
*       validation?: (value: any) => (string | null) | Promise<string | null>
 *    },
 *    script?: (output: Record<string, any>,prompts: Record<string, any>) => any,
 *    print?: (output: Record<string, any>, prompts: Record<string, any>) => any,
 *  }[]}} GlobalScript
 */
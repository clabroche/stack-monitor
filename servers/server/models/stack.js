const { sockets } = require('@clabroche/common-socket-server');
const path = require('path');
const { watch } = require('fs');
const debounce = require('debounce');
const _ = require('lodash');
const plugins = require('@clabroche/modules-plugins-loader-backend');
const fs = require('fs');
const PromiseB = require('bluebird');
const dot = require('dot-object');
const pathfs = require('path');
const { existsSync } = require('fs-extra');
const Service = require('./Service');
const myConfs = require('./myConfs');
const ports = require('./ports');

if (!sockets.io) throw new Error('Stack monitor seems not fully inialized: Socket is empty, check if socket connection is launched before require this file');

class Stack {
  /** @type {Stack | null} */
  static #currentStack = null;

  /** @type {fs.FSWatcher[]} */
  static #currentWatches = [];

  /** @type {string} */
  static #currentEnvironment = '';

  /** @type {() => void} */
  static #onLaunchCallback = () => { };

  /** @type {(service: Service) => void} */
  static #onServiceRestart = () => { };

  /** @type {(service: Service) => void} */
  static #onServiceStart = () => { };

  /** @type {(service: Service, code: number | null) => void} */
  static #onServiceCrash = () => { };

  /** @type {(service: Service) => void} */
  static #onServiceKill = () => { };

  static parsers = {
    links: require('../parser/link'),
    jsons: require('../parser/json'),
    debug: require('../parser/debug'),
  };

  static getSave = require('./saves');

  static Socket = sockets;

  static plugins = plugins;

  /** @type {string} */
  static version = require('../helpers/version').version || '';

  /** @type {string} */
  static url = `http://localhost:${ports.http}`;

  /** @type {number} */
  static port = +ports.http;

  static helpers = require('../helpers/exportedHelpers');

  /** @param {Partial<Stack>} stack */
  constructor(stack) {
    /** @type {string | undefined} */
    this.confPath = stack.confPath;
    /** @type {string[]} */
    this.watchFiles = stack.watchFiles || [];
    /** @type {import('./Service').Parser[]} */
    this.logParsers = stack.logParsers || [];
    /** @type {boolean} */
    this.monorepo = stack.monorepo || false;
    /** @type {Record<string, string>} */
    this.themes = stack.themes || {};
    /** @type {string | undefined} */
    this.documentation = stack.documentation;
    /** @type {Service[]} */
    this.services = (stack.services || []).map((service) => (
      new Service(service, /** @type {StackWithPlugins} */(Stack))
    ));

    this.helpers = require('../helpers/exportedHelpers');
  }

  /** @param {{label: string, enabled: boolean}[]} servicesLabelSelected */
  async enable(servicesLabelSelected) {
    const services = this.getServices();
    await PromiseB.map(servicesLabelSelected, (serviceConf) => {
      const service = services.find((service) => serviceConf.label === service.label);
      if (!service) return null;
      const hasChanged = serviceConf.enabled !== service.enabled;
      if (hasChanged) {
        if (serviceConf.enabled) {
          service.enable();
          return service.launch();
        }
        service.disable();
        return service.kill();
      }
      return null;
    });
  }

  async restart() {
    await PromiseB.map(this.getEnabledServices(), (service) => service.restart());
  }

  async kill() {
    await PromiseB.map(this.getEnabledServices(), (service) => service.kill());
  }

  static getCurrentEnvironment() {
    return Stack.environments?.[this.#currentEnvironment];
  }

  exportForDifference() {
    return {
      watchFiles: this.watchFiles,
      themes: this.themes,
      services: this.services.map((s) => s.exportForDifference()),
    };
  }

  /**
   *
   * @param {string} confPath
   * @param {typeof Stack} injection
   * @returns
   */
  static async parse(confPath, injection) {
    delete require.cache[require.resolve(confPath)];
    let rawStack;
    try {
      rawStack = confPath ? require(confPath) : [];
    } catch (error) {
      // Because sometimes require failed on reload
      rawStack = confPath ? require(confPath) : [];
    }
    if (Array.isArray(rawStack)) {
      return new Stack({ services: rawStack, confPath });
    } if (typeof rawStack === 'function') {
      const stack = await rawStack(injection);
      return new Stack({
        ...stack,
        confPath,
        services: stack.services || stack.stack,
      });
    }
    return new Stack({
      ...rawStack,
      confPath,
      services: rawStack.services || rawStack.stack,
    });
  }

  async launch() {
    await PromiseB.map(this.getServices(), (microservice) => {
      if (microservice.enabled) {
        return microservice.launch();
      }
      return microservice.kill();
    });
    Stack.#onLaunchCallback();
  }

  static getStack() {
    return Stack.#currentStack;
  }

  static getServices() {
    return Stack.#currentStack?.services || [];
  }

  getServices() {
    return Stack.getServices();
  }

  static getEnabledServices() {
    return Stack.getServices().filter((s) => s.enabled);
  }

  getEnabledServices() {
    return Stack.getEnabledServices();
  }

  exportInApi() {
    const res = { ...this };
    res.services = res.services?.map((s) => s.exportInApi());
    return res;
  }

  /**
   *
   * @param {string} serviceLabel
   * @returns
   */
  static findService(serviceLabel) {
    return Stack.getServices().filter((s) => s.label === serviceLabel)[0];
  }

  /**
   *
   * @param {string} serviceLabel
   * @returns
   */
  findService(serviceLabel) {
    return Stack.findService(serviceLabel);
  }

  /** @param {string} confPath */
  static async selectConf(confPath, services) {
    confPath = pathfs.resolve(confPath);
    if (Stack.#currentWatches?.length) Stack.#currentWatches.forEach((currentWatch) => currentWatch.close());
    confPath = path.resolve(confPath);
    await myConfs.add(confPath);
    Stack.#currentStack = await this.parse(confPath, this);
    [
      ...(Stack.#currentStack?.watchFiles || []),
      confPath,
      ...Stack.getServices().flatMap((service) => {
        const envRootPath = service.rootPath && pathfs.resolve(service.rootPath, '.env');
        const envSpawnOptionsPath = service.spawnOptions.cwd && pathfs.resolve(service.spawnOptions.cwd.toString(), '.env');
        const commandPaths = service.commands.map((command) => {
          const commandPath = command?.spawnOptions?.cwd && pathfs.resolve(command.spawnOptions.cwd.toString(), '.env');
          return commandPath && existsSync(commandPath) ? commandPath : null;
        });
        return [
          envRootPath && existsSync(envRootPath) ? envRootPath : null,
          envSpawnOptionsPath && existsSync(envSpawnOptionsPath) ? envSpawnOptionsPath : null,
          ...commandPaths,
        ];
      }),
    ]
      .filter((a, i, arr) => a && arr.indexOf(a) === i)
      .forEach((filePath) => {
        if (filePath && fs.existsSync(filePath)) {
          Stack.#currentWatches.push(
            watch(filePath, async () => {
              checkConfDebounce(filePath);
            }),
          );
        } else console.error(filePath, 'not exists');
      });
    if (services?.length) {
      await PromiseB.map(services || [], async (_service) => {
        const service = Stack.findService(_service);
        if (service) {
          await service.launch(true);
        }
      });
    }
    sockets.io?.emit('stack:selectConf');
  }

  /**
   * @template {Record<string, Environment>} T
   * @param { T | undefined } env
   * @param {keyof T & string} defaultEnvironment
   * @returns {never}
   */
  static setEnvironments(env, defaultEnvironment) {
    if (!this.#currentEnvironment) this.#currentEnvironment = defaultEnvironment;
    if (JSON.stringify(this.environments) === JSON.stringify(env)) {
      return /** @type {never} */(this.environments?.[this.#currentEnvironment]?.envs);
    }
    this.environments = env;
    console.log('Environment changed, reload page...');
    sockets.io?.emit('forceReload');
    return /** @type {never} */(this.environments?.[this.#currentEnvironment]?.envs);
  }

  /**
   *
   * @param {string} envLabel
   */
  async changeEnvironment(envLabel) {
    if (Stack.environments?.[envLabel]) {
      Stack.#currentEnvironment = envLabel;
      const enabledServices = Stack.getEnabledServices();
      await Stack.getStack()?.kill();
      enabledServices.forEach((s) => {
        s.enabled = true;
        s.store = [];
      });
      const stack = Stack.getStack();
      if (stack?.confPath) {
        await checkConf(stack.confPath);
      }
      await Stack.getStack()?.launch();
    } else {
      throw new Error('env not found');
    }
  }

  /** @param {() => void} cb  */
  static onLaunch(cb) {
    this.#onLaunchCallback = cb;
  }

  triggerOnLaunch() {
    return Stack.#onLaunchCallback();
  }

  /** @param {(service: Service) => void} cb  */
  static onServiceRestart(cb) {
    this.#onServiceRestart = cb;
  }

  /** @param  {Service} service */
  triggerOnServiceRestart(service) {
    return Stack.#onServiceRestart(service);
  }

  /** @param {(service: Service) => void} cb  */
  static onServiceStart(cb) {
    this.#onServiceStart = cb;
  }

  /** @param  {Service} service */
  triggerOnServiceStart(service) {
    return Stack.#onServiceStart(service);
  }

  /** @param {(service: Service, code?: number | null) => void} cb  */
  static onServiceCrash(cb) {
    this.#onServiceCrash = cb;
  }

  /**
   * @param {Service} service
   * @param {number | null} code
   */
  triggerOnServiceCrash(service, code) {
    return Stack.#onServiceCrash(service, code);
  }

  /** @param {(service: Service) => void} cb  */
  static onServiceKill(cb) {
    this.#onServiceKill = cb;
  }

  /** @param  {Service} service */
  triggerOnServiceKill(service) {
    return Stack.#onServiceKill(service);
  }

  static stopWatchers() {
    Stack.#currentWatches.forEach((currentWatch) => currentWatch.close());
  }
}

const pluginsToLoad = /** @type {(keyof typeof plugins)[]} */(Object.keys(plugins)).reduce((p, key) => {
  const plugin = plugins[key];
  if (plugin.export) {
    p[key] = typeof plugin.export === 'function'
      ? plugin.export(/** @type {StackWithPlugins} */(Stack))
      // @ts-ignore
      : plugin.export;
  }
  return p;
}, /** @type {OmitNever<typeof plugins>} */({}));

module.exports = /** @type {StackWithPlugins} */(Object.assign(Stack, pluginsToLoad));
/**
 * @param {Stack} originalStack
 * @param {Stack} newStack
 */
async function reloadService(originalStack, newStack) {
  const newData = newStack.exportForDifference();
  const updatedServices = originalStack.services.filter((originalService) => {
    const newService = newData.services.find((s) => s.label === originalService.label);
    if (newService?.label) {
      const diffs = difference(originalService.exportForDifference(), newService);
      if (!Object.keys(diffs)?.length) return null;
      let shouldRestart = false;
      Object.keys(diffs).forEach((key) => {
        if (key.includes('spawnOptions.shell')) return null; // spawnOptions.shell is set by stack-monitor not user
        if (diffs[key]?.to) {
          dot.copy('to', key, diffs[key], originalService);
          shouldRestart = true;
        } else if (!diffs[key]?.to) {
          dot.delete(key, originalService);
          shouldRestart = true;
        }
        return null;
      });
      return shouldRestart;
    }
    console.log('Changes not taken. Please restart stack-monitor...');
    return false;
  });

  sockets.io?.emit('conf:update', updatedServices.map((s) => s.label));
  await PromiseB.map(updatedServices, async (service) => {
    if (service.pids?.length) {
      console.log('Restart', service.label);
      await service.restart();
    }
  });
}
/**
 * @param {Stack} originalStack
 * @param {Stack} newStack
 */
async function reloadGloblalConf(originalStack, newStack) {
  const diffs = difference(
    { ...originalStack.exportForDifference(), services: [] },
    { ...newStack.exportForDifference(), services: [] },
  );
  if (!Object.keys(diffs).length) return false;
  Object.keys(diffs).forEach((key) => {
    // @ts-ignore
    dot.copy('to', key, diffs[key], originalStack);
  });
  console.log('Global changes, restart all...');
  await originalStack.restart();
  sockets.io?.emit('forceReload');
  return null;
}

/**
 * @param {string} path
 */
const checkConf = async (path = '') => {
  try {
    if (path?.endsWith('.js')) delete require.cache[require.resolve(path)];
    const originalStack = Stack.getStack();
    if (!originalStack?.confPath) return;
    const newStack = await Stack.parse(originalStack.confPath, Stack);
    if (!newStack) return;
    await reloadService(originalStack, newStack);
    await reloadGloblalConf(originalStack, newStack);
  } catch (error) {
    console.error(error);
  }
};
const checkConfDebounce = debounce(
  checkConf,
  100,
  { immediate: false },
);

/**
 * Deep diff between two object, using lodash
 * @param  {Record<string, any>} fromObject Object compared
 * @param  {Record<string, any>} toObject   Object to compare with
 * @return {Record<string, any>}        Return a new object who represent the diff
 */
function difference(fromObject, toObject) {
  const changes = {};
  const buildPath = (/** @type {any} */ _path, /** @type {string} */ key) => (_.isUndefined(_path) ? key : `${_path}.${key}`);
  const walk = (
    /** @type {Object} */ _fromObject,
    /** @type {Object | undefined} */ _toObject,
    /** @type {string | undefined} */ _path,
  ) => {
    for (const key of _.keys(_fromObject)) {
      const currentPath = buildPath(_path, key);
      if (!_.has(_toObject, key)) {
        // @ts-ignore
        changes[currentPath] = { from: _.get(_fromObject, key) };
      }
    }
    for (const [key, to] of _.entries(_toObject)) {
      const currentPath = buildPath(_path, key);
      if (!_.has(_fromObject, key)) {
        // @ts-ignore
        changes[currentPath] = { to };
      } else {
        const from = _.get(_fromObject, key);
        if (!_.isEqual(from, to)) {
          if (_.isObjectLike(to) && _.isObjectLike(from)) {
            walk(from, to, currentPath);
          } else {
            // @ts-ignore
            changes[currentPath] = { from, to };
          }
        }
      }
    }
  };
  walk(fromObject, toObject);
  return changes;
}

/**
 * @typedef {typeof Stack & OmitNever<typeof plugins>} StackWithPlugins
 */

/**
 * @typedef {Omit<import('@clabroche/common-typings').NonFunctionProperties<Service>, 'pids' | 'store' | 'enabled'>[]} StackArray
 */

/**
 * @typedef {{
 * watchFiles?: string[],
 * logParsers?: import('./Service').Parser[],
 * stack?: StackArray,
 * monorepo?: boolean,
 * services?: StackArray,
 * }} StackObject
 */

/**
 * @typedef {(stackMonitor: StackWithPlugins) => StackObject | Promise<StackObject>} StackFunction
 */

/**
 * @typedef {StackArray | StackObject | StackFunction} StackFile
 */

/**
 * @typedef {{
 *  id?: string,
 *  label: string,
 *  envs: Record<string, any>,
 *  color?: string,
 *  bgColor?: string
 * }} Environment
 */

/**
 * @template {{ [key: string]: {export: any }}} T
 * @typedef {{
 *  [K in keyof T]: T[K]['export'] extends Function ? ReturnType<T[K]['export']> : never;
 * }} KeysMatching
 */
/**
 * @template {{ [key: string]: {export: any }}} T
 * @typedef {{ [K in keyof T as (
 *  T[K]['export'] extends undefined|null ? never : K)
 * ]: T[K]['export'] extends Function ? ReturnType<T[K]['export']> : T[K]['export'] }} OmitNever
 */

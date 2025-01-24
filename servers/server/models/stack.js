/* eslint-disable func-names */
// eslint-disable-next-line import/no-extraneous-dependencies
const { sockets } = require('@clabroche/common-socket-server');
// eslint-disable-next-line import/no-extraneous-dependencies
const plugins = require('@clabroche/modules-plugins-loader-backend');
const PromiseB = require('bluebird');
const Service = require('./Service');
const ports = require('./ports');
const dbs = require('../helpers/dbs');
const EnvironmentModel = require('./Environment');
const EncryptionKey = require('./EncryptionKey');

if (!sockets.io) throw new Error('Stack monitor seems not fully inialized: Socket is empty, check if socket connection is launched before require this file');

/** @param {Partial<Stack>} stack */
function Stack(stack) {
  return (async () => {
    /** @type {string[]} */
    this.watchFiles = stack.watchFiles || [];
    /** @type {import('./Service').Parser[]} */
    this.logParsers = stack.logParsers || [];
    /** @type {boolean} */
    this.monorepo = stack.monorepo || false;
    /** @type {Record<string, string>} */
    this.themes = stack.themes || {};
    /** @type {import('./Environment')[]} */
    this.environments = stack.environments ? stack.environments.map((env) => new EnvironmentModel(env)) : [];
    /** @type {string | undefined} */
    this.documentation = stack.documentation;
    /** @type {Service[]} */
    this.services = await PromiseB.map(stack.services || [], (service) => (
      new Service(service, /** @type {StackWithPlugins} */(Stack))
    ));

    this.helpers = require('../helpers/exportedHelpers');
    return this;
  })();
}

/** @type {Stack | null} */
Stack.currentStack = null;
/** @type {import('fs').FSWatcher[]} */
Stack.currentWatches = [];
/** @type {import('./Environment') | null} */
Stack.currentEnvironment = null;
Stack.Socket = sockets;
Stack.plugins = plugins;
/** @type {string} */
Stack.version = require('../helpers/version').version || '';
/** @type {string} */
Stack.url = `http://localhost:${ports.http}`;
/** @type {number} */
Stack.port = +ports.http;
Stack.parsers = {
  links: require('../parser/link'),
  jsons: require('../parser/json'),
  debug: require('../parser/debug'),
};
Stack.helpers = require('../helpers/exportedHelpers');
Stack.getSave = require('./saves');

/** @param {{label: string, enabled: boolean}[]} servicesLabelSelected */
Stack.prototype.enable = async function (servicesLabelSelected) {
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
};

Stack.restart = async function () {
  await PromiseB.map(this.getEnabledServices(), (service) => service.restart());
};

Stack.kill = async function () {
  await PromiseB.map(this.getEnabledServices(), (service) => service.kill());
};

Stack.getCurrentEnvironment = function () {
  return Stack.currentEnvironment;
};

Stack.prototype.toStorage = function () {
  return {
    watchFiles: this.watchFiles,
    themes: this.themes,
    services: this.services.map((s) => s.toStorage()),
  };
};

Stack.parse = async function () {
  const dbsRootPath = await dbs.getDbs('services');
  let services = [];
  let environments = [];
  try {
    services = await PromiseB.map(dbsRootPath, (id) => Service.load(id, Stack));
    environments = await EnvironmentModel.all();
  } catch (error) {
    console.error(error);
    this.Socket.emit('system:wrongKey');
  }

  return new Stack({
    environments,
    services,
  });
};

Stack.prototype.launch = async function () {
  await PromiseB.map(this.getServices(), (microservice) => {
    if (microservice.enabled) {
      return microservice.launch();
    }
    return microservice.kill();
  });
};

Stack.getStack = function () {
  return Stack.currentStack;
};

Stack.getServices = function () {
  return Stack.currentStack?.services || [];
};

Stack.deleteService = async function (label) {
  if (!Stack.currentStack) return;
  const service = this.findService(label);
  Stack.currentStack.services = Stack.currentStack.services.filter((a) => a.label !== label);
  await service.delete();
};

Stack.prototype.getServices = function () {
  return Stack.getServices();
};

Stack.getEnabledServices = function () {
  return Stack.getServices().filter((s) => s.enabled);
};

Stack.prototype.getEnabledServices = function () {
  return Stack.getEnabledServices();
};

Stack.prototype.exportInApi = function () {
  const res = { ...this };
  res.services = res.services?.map((s) => s.exportInApi());
  return res;
};

/**
   *
   * @param {string} serviceLabel
   * @returns
   */
Stack.findService = function (serviceLabel) {
  return Stack.getServices().filter((s) => s.label === serviceLabel)[0];
};

/**
   *
   * @param {string} serviceLabel
   * @returns
   */
Stack.prototype.findService = function (serviceLabel) {
  return Stack.findService(serviceLabel);
};

Stack.selectConf = async function () {
  await EncryptionKey.init();
  if (!EncryptionKey.encryptionKey) {
    await EncryptionKey.saveKey(await EncryptionKey.generateKey());
  }
  Stack.currentStack = await this.parse();
  Stack.currentEnvironment = process.env.STACK_MONITOR_DEFAULT_ENVIRONMENT
    ? Stack.currentStack.environments.find((env) => env.label === process.env.STACK_MONITOR_DEFAULT_ENVIRONMENT) || null
    : Stack.currentStack.environments.find((env) => env.default) || null;
  if (process.env.STACK_MONITOR_SERVICES) {
    process.env.STACK_MONITOR_SERVICES.split(',').forEach((serviceLabel) => {
      const service = Stack.findService(serviceLabel)
      if(service) service.enable()
    })
  }
  return sockets.emit('stack:selectConf');
};

/**
   *
   * @param {string} envLabel
   */
Stack.prototype.changeEnvironment = async function (envLabel) {
  const environment = await EnvironmentModel.find(envLabel);
  if (environment) {
    Stack.currentEnvironment = environment;
    Stack.getServices().forEach((service) => {
      if (!service.envs[envLabel]) {
        service.envs[envLabel] = {};
      }
    });
    const enabledServices = Stack.getEnabledServices();
    await Stack.kill();
    enabledServices.forEach((s) => {
      s.enabled = true;
      s.store = [];
    });
    await Stack.getStack()?.launch();
  } else {
    throw new Error('Environment not found');
  }
};

Stack.stopWatchers = function () {
  Stack.currentWatches.forEach((currentWatch) => currentWatch.close());
};

const pluginsToLoad = /** @type {(keyof typeof plugins)[]} */(Object.keys(plugins)).reduce((p, key) => {
  const plugin = plugins[key];
  if (plugin.export) {
    p[key] = typeof plugin.export === 'function' && !(/^\s*class\s+/.test(plugin.export.toString()))
      ? plugin.export(/** @type {StackWithPlugins} */(Stack))
      // @ts-ignore
      : plugin.export;
  }
  return p;
}, /** @type {OmitNever<typeof plugins>} */({}));

module.exports = /** @type {StackWithPlugins} */(Object.assign(Stack, pluginsToLoad));

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
 *  default?: boolean
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

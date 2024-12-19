const { readdir, mkdir } = require('fs/promises');
const PromiseB = require('bluebird');
const pathfs = require('path');
const { existsSync } = require('fs');
const dbs = require('../helpers/dbs');

class Environment {
  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Environment>} environment
   */
  constructor(environment) {
    /** @type {string} */
    this.label = environment.label || '';
    /** @type {boolean} */
    this.default = environment.default || false;
    /** @type {string} */
    this.color = environment.color || '';
    /** @type {string} */
    this.bgColor = environment.bgColor || '';
    /** @type {{[key: string]: string}} */
    this.envs = environment.envs || {};
  }

  static async load(label, Stack) {
    return new Environment(await dbs.getDb(`envs/${label}`).read(), Stack);
  }

  static async all() {
    const allDbds = await dbs.getDbs('envs');

    const environments = await PromiseB.map(allDbds, (id) => Environment.load(id));
    if (!environments.length) {
      const localEnv = new Environment({
        bgColor: '#FFFFFF',
        color: '#000000',
        default: true,
        label: 'Local',
      });
      await localEnv.save();
      environments.push(localEnv);
    }
    return environments;
  }

  static async find(envLabel) {
    const envs = await this.all();
    return envs.find((env) => env.label === envLabel);
  }

  async save() {
    const obj = this.toStorage();
    await dbs.getDb(`envs/${this.label}`).write(obj);
  }

  async update(env) {
    this.default = env.default;
    this.color = env.color;
    this.bgColor = env.bgColor;
    this.envs = env.envs;
    await dbs.getDb(`envs/${this.label}`).write(this.toStorage());
  }

  async delete() {
    await dbs.getDb(`envs/${this.label}`).delete();
  }

  toStorage() {
    return {
      label: this.label,
      default: this.default,
      color: this.color,
      bgColor: this.bgColor,
      envs: this.envs,
    };
  }
}

module.exports = Environment;

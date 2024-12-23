const PromiseB = require('bluebird');
const { randomUUID } = require('crypto');
const dbs = require('../helpers/dbs');

const nativeParsers = {
  [require('../parser/debug').id]: require('../parser/debug'),
  [require('../parser/json').id]: require('../parser/json'),
  [require('../parser/link').id]: require('../parser/link'),
};
class Parser {
  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Parser>} parser
   */
  constructor(parser) {
    /** @type {string} */
    this.label = parser.label || '';
    /** @type {string} */
    this.id = parser.id || randomUUID();
    /** @type {string} */
    this.transform = parser.transform || '';
    /** @type {boolean} */
    this.readonly = parser.readonly || false;
    try {
      /** @type {Function} */
      this.transformFunction = typeof parser.transform === 'string' ? eval(parser.transform) : parser.transform;
    } catch (error) {
      console.error('[PARSER]:', this.label, 'Cannot interpret your parser', error);
    }
  }

  static async load(id) {
    if (nativeParsers[id]) return new Parser(nativeParsers[id]);
    return new Parser(await dbs.getDb(`parsers/${id}`).read());
  }

  static async all() {
    const allDbds = [
      ...await dbs.getDbs('parsers'),
      ...Object.keys(nativeParsers),
    ];
    return PromiseB.map(allDbds, (id) => this.load(id));
  }

  static async find(envId) {
    const parsers = await this.all();
    return parsers.find((env) => env.id === envId);
  }

  async save() {
    const obj = this.toStorage();
    await dbs.getDb(`parsers/${this.id}`).write(obj);
    return this;
  }

  async update(env) {
    this.transform = env.transform;
    this.label = env.label;
    await dbs.getDb(`parsers/${this.id}`).write(this.toStorage());
  }

  async delete() {
    await dbs.getDb(`parsers/${this.id}`).delete();
  }

  toStorage() {
    return {
      id: this.id,
      label: this.label,
      transform: this.transform,
    };
  }
}

module.exports = Parser;

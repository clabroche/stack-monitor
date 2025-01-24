const PromiseB = require('bluebird');
const { randomUUID } = require('crypto');
const dbs = require('../../../servers/server/helpers/dbs');
const db = dbs.getDb(`documentations`)
const dbDocumentationTree = dbs.getDb(`documentations-tree`, {encrypted: true, defaultData: []}).alasql
class Documentation {
  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Documentation>} documentation
   */
  constructor(documentation) {
    /** @type {string} */
    this.id = documentation.id || '';
    /** @type {string} */
    this.text = documentation.text || '';
  }

  static async load(id) {
  }

  static async all() {
    return db.alasql.select('Select * from ?')
  }

  static async find(envId) {
    const documentations = await this.all();
    return documentations.find((env) => env.id === envId);
  }

  async save() {
    const obj = this.toStorage();
    await dbs.getDb(`documentations/${this.id}`).write(obj);
    return this;
  }

  async update(env) {
    this.transform = env.transform;
    this.label = env.label;
    await dbs.getDb(`documentations/${this.id}`).write(this.toStorage());
  }

  async delete() {
    await dbs.getDb(`documentations/${this.id}`).delete();
  }

  toStorage() {
    return {
      id: this.id,
      label: this.label,
      transform: this.transform,
    };
  }
}

module.exports = Documentation;

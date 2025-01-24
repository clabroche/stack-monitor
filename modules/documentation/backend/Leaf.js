const PromiseB = require('bluebird');
const { randomUUID } = require('crypto');
const dbs = require('../../../servers/server/helpers/dbs');
const { v4 } = require('uuid');
const dbLeafTree = dbs.getDb(`leafs-leafs`, {encrypted: true, defaultData: []}).alasql
class Leaf {
  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Leaf>} leaf
   */
  constructor(leaf) {
    /** @type {string} */
    this.id = leaf.id || v4();
    /** @type {string} */
    this.docId = leaf.docId || '';
    /** @type {string} */
    this.serviceId = leaf.serviceId || '';
    /** @type {string} */
    this.label = leaf.label || '';
    /** @type {number} */
    this.position = leaf.position || -1;
    /** @type {string} */
    this.text = leaf.text || '';
    /** @type {string} */
    this.parentId = leaf.parentId || '';
  }

  static async getTree(serviceLabel) {
    const leafs = await dbLeafTree.read(`Select * from ${dbLeafTree.table} ${serviceLabel ? `where serviceId = '${serviceLabel}'` : `where serviceId=''`}`)
    return leafs
  }
  toStorage() {
    return {
      docId: this.docId,
      position: this.position,
      serviceId: this.serviceId,
      label: this.label,
      text: this.text,
      parentId: this.parentId,
    }
  }

  async remove() {
    return dbLeafTree.write(`DELETE from ${dbLeafTree.table} where id = '${this.id}'`)
  }

  static async find({id}) {
    const [leaf] = await dbLeafTree.read(`Select * from ${dbLeafTree.table} where id='${id}'`)
    return leaf ? new Leaf(leaf) : null
  }

  async save() {
    const leafExists = await Leaf.find({id: this.id})
    const storage = this.toStorage()
    const set = dbLeafTree.buildUpdateQuery(storage)
    await leafExists
      ? dbLeafTree.write(`update ${dbLeafTree.table} set ${set} where id='${this.id}'`)
      : dbLeafTree.write(`insert into ${dbLeafTree.table} values ${JSON.stringify({
        ...this.toStorage(),
        id: this.id,
      })}`)
    return this
  }

}

module.exports = Leaf;

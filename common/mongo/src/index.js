const {
  MongoClient, ObjectID, ObjectId,
} = require('mongodb');

/* Promisify setTimeout function */
const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
class MongoConnect {
  constructor() {
    /** @type {string} */
    this.url = null;
    /** @type {string} */
    this.prefix = null;
    /** @type {import('mongodb').Db} */
    this.db = null;
    /** @type {string} */
    this.dbName = null;
    /** @type {import('mongodb').MongoClient} */
    this.client = null;
    /** @type {number} */
    this.wait_ms_for_retry = 5000;
    /** @type {boolean} */
    this.gracefull_close = false;
  }

  /**
   * @returns {Promise<import('mongodb').Db>}
   */
  async _connect() {
    while (this.client == null) {
      try {
        this.client = await MongoClient.connect(this.url, this.options);
      } catch (err) {
        console.error(err);
        console.info('Trying to reconnect in 5 secs.');
        await wait(this.wait_ms_for_retry);
      }
    }
    this.db = this.client.db(this.dbName);
    this.client.on('close', () => {
      this.db = null;
      this.client = null;
      return this.gracefull_close ? undefined : this._connect(); // auto-reconnect
    });
    return this.db;
  }

  /**
   * @param {String} url
   * @param {String} prefix
   * @returns {Promise<import('mongodb').Db>}
   */
  async connect(url, prefix, dbName = 'clabroche') {
    this.url = url;
    this.prefix = prefix;
    this.dbName = dbName;
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    return this._connect();
  }

  /**
   * @param {String} name
   * @returns {import('mongodb').Collection<any>}
   */
  collection(name) {
    if (this.db) {
      return this.prefix
        ? this.db.collection(`${this.prefix}-${name}`)
        : this.db.collection(`${name}`);
    }
    
    throw new Error('DB not instanciate: call mongo.connect(url) before');
  }

  /**
   *
   * @param {string | number | ObjectID | null} id
   */
  getID(id = null) {
    return this.IsValidObjectId(id)
      ? new ObjectId(id)
      : id;
  }

  IsValidObjectId(value) {
    const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
    return checkForHexRegExp.test(value);
  }

  async close() {
    this.gracefull_close = true;
    await this.client.close();
  }

  /**
   * @param {Date} date
   * @returns {ObjectID}
   */
  getIdFromDate(date) {
    let timestamp = (date.getTime() / 1000 | 0).toString(16);
    let length = 16;
    while (length > 0) {
      timestamp += (Math.random() * 16 | 0).toString(16);
      length--;
    }
    return ObjectID.createFromHexString(timestamp);
  }
}
module.exports = MongoConnect;
module.exports.mongo = new MongoConnect();

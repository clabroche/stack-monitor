import axios from '../helpers/axios';

class Service {
  /** @param {import('@clabroche/common-typings').NonFunctionProperties<Service>} service */
  constructor(service) {
    /** @type {string} */
    this.label = service.label || ''
    /** @type {Array<Record<any, any>>} */
    this.commands = service.commands || [];
    /** @type {string} */
    this.rootPath = service.rootPath || this.commands?.[0]?.spawnOptions?.cwd || '';
    this.envs = {}
    this.shortcuts = []
    this.updateFields(service);
  }

  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Service>} service
   */
  updateFields(service) {
    if (!service.label) throw new Error('A service should have a label');
    
    // Update simple properties
    /** @type {string} */
    this.label = service.label;
    /** @type {string} */
    this.description = service.description || '';
    /** @type {string} */
    this.url = service.url || '';
    /** @type {string} */
    this.openapiURL = service.openapiURL || '';
    /** @type {string} */
    this.spawnCmd = service.spawnCmd || '';
    /** @type {boolean} */
    this.enabled = service.enabled || false;
    /** @type {boolean} */
    this.crashed = service.crashed || false;
    /** @type {boolean} */
    this.exited = service.exited || false;

    // Update arrays of primitives
    /** @type {string[]} */
    this.groups = service.groups || [];
    /** @type {string[]} */
    this.parsers = service.parsers || [];
    /** @type {string[]} */
    this.urls = service.urls || [];
    /** @type {string[]} */
    this.spawnArgs = service.spawnArgs || [];
    
    // Update complex objects while preserving references
    // Health object
    if (!this.health) this.health = {};
    this._updateObjectWithReferences(this.health, service.health || {
      enabled: false,
      url: '',
      interval: '',
      method: 'GET',
      returnCode: 200,
      responseText: '',
      timeout: 0,
      startAfter: 0,
    });
    
    // Git object
    if (!this.git) this.git = {};
    this._updateObjectWithReferences(this.git, service.git || {
      home: '',
      remote: '',
      branches: [],
      stash: [],
      delta: 0,
      currentBranch: '',
      status: [],
    });
    
    // SpawnOptions object
    if (!this.spawnOptions) this.spawnOptions = {};
    this._updateObjectWithReferences(this.spawnOptions, service.spawnOptions || {
      cwd: '',
      env: '',
    });
    
    // Commands array of objects
    if (!this.commands) this.commands = [];
    if (service.commands) {
      this._updateArrayWithReferences(this.commands, service.commands, 'spawnCmd');
    } else {
      this.commands.length = 0;
    }
    
    // Shortcuts array of objects
    if (!this.shortcuts) this.shortcuts = [];
    if (service.shortcuts) {
      this._updateArrayWithReferences(this.shortcuts, service.shortcuts, 'label');
    } else {
      this.shortcuts.length = 0;
    }
    
    // Envs object (nested objects)
    if (!this.envs) this.envs = {};
    this._updateObjectWithReferences(this.envs, service.envs || {});
    
    // Root path
    /** @type {string} */
    this.rootPath = service.rootPath || this.commands?.[0]?.spawnOptions?.cwd || '';
    
    // Container object
    if (service.container) {
      if (!this.container) this.container = {};
      this._updateObjectWithReferences(this.container, service.container);
      
      if (!this.container.volumes) this.container.volumes = [];
      if (!this.container.ignoreVolumes) this.container.ignoreVolumes = [];
    } else {
      this.container = service.container;
    }
    
    // Meta object
    if (!this.meta) this.meta = {};
    this._updateObjectWithReferences(this.meta, service.meta || {});
  }

  /**
   * Updates an array while preserving object references when possible
   * @param {Array<Record<string, any>>} existingArray - The current array to update
   * @param {Array<Record<string, any>>} newArray - The new array with updated data
   * @param {string} idField - The field to use as an identifier
   * @private
   */
  _updateArrayWithReferences(existingArray, newArray, idField) {
    if (!existingArray || !newArray) return;
    
    // Create a map of existing items by identifier
    const existingMap = {};
    existingArray.forEach(item => {
      if (item && item[idField]) {
        existingMap[item[idField]] = item;
      }
    });
    
    // Clear the array but maintain the reference
    existingArray.length = 0;
    
    // Add items from the new array, preserving references where possible
    newArray.forEach(newItem => {
      if (newItem && newItem[idField] && existingMap[newItem[idField]]) {
        // Update existing item
        const existingItem = existingMap[newItem[idField]];
        this._updateObjectWithReferences(existingItem, newItem);
        existingArray.push(existingItem);
      } else {
        // Add new item
        existingArray.push(newItem);
      }
    });
  }

  /**
   * Updates an object while preserving nested references when possible
   * @param {Record<string, any>} existingObj - The current object to update
   * @param {Record<string, any>} newObj - The new object with updated data
   * @private
   */
  _updateObjectWithReferences(existingObj, newObj) {
    if (!existingObj || !newObj) return;
    
    // Handle removals - remove properties that no longer exist
    Object.keys(existingObj).forEach(key => {
      if (!(key in newObj)) {
        delete existingObj[key];
      }
    });
    
    // Update or add properties
    Object.keys(newObj).forEach(key => {
      const newValue = newObj[key];
      
      // Skip if the value is undefined
      if (newValue === undefined) return;
      
      // If the property doesn't exist yet in the target, just assign it
      if (!(key in existingObj)) {
        existingObj[key] = newValue;
        return;
      }
      
      const existingValue = existingObj[key];
      
      // Handle different types
      if (newValue === null) {
        // Set null values directly
        existingObj[key] = null;
      } else if (Array.isArray(newValue)) {
        // Handle arrays
        if (!Array.isArray(existingValue)) {
          // If the existing value is not an array, replace it
          existingObj[key] = newValue;
        } else if (
          newValue.length > 0 && 
          typeof newValue[0] === 'object' && 
          newValue[0] !== null
        ) {
          // For arrays of objects, try to find a common id field
          const sampleObj = newValue[0];
          const possibleIdFields = ['id', 'name', 'label', 'spawnCmd', 'key'];
          const idField = possibleIdFields.find(field => field in sampleObj) || Object.keys(sampleObj)[0];
          
          this._updateArrayWithReferences(existingValue, newValue, idField);
        } else {
          // For arrays of primitives, replace the contents
          existingValue.length = 0;
          newValue.forEach(item => existingValue.push(item));
        }
      } else if (typeof newValue === 'object') {
        // Handle objects (recursively)
        if (typeof existingValue !== 'object' || existingValue === null) {
          // If the existing value is not an object, replace it
          existingObj[key] = newValue;
        } else {
          // Recursively update the nested object
          this._updateObjectWithReferences(existingValue, newValue);
        }
      } else {
        // Handle primitives (direct assignment)
        existingObj[key] = newValue;
      }
    });
  }

  async updateGit() {
    if (this.git?.remote) {
      this.git.branches = await this.getBranches();
      this.git.currentBranch = await this.getCurrentBranch();
      this.git.status = await this.getStatus();
      const list = await this.stashList();
      this.git.stash = list;
    }
  }

  async fetch() {
    const { data: service } = await axios.get(`/stack/${this.label}/`);
    this.updateFields(service);
    return this;
  }

  /** @returns {Promise<LogMessage[]>} */
  async getLogs() {
    const { data: logs } = await axios.get(`/logs/${this.label}/logs`);
    return logs;
  }

  /** @param {{command: any, pid?: number}} prompt */
  async sendTerminalPrompt(prompt) {
    const { data: logs } = await axios.post(`/logs/${this.label}/prompt`, { ...prompt, service: this.label });
    return logs;
  }

  /** @param {{pid?: number, forceKill?: boolean}} prompt */
  async sendTerminalTerminate(prompt) {
    const { data: logs } = await axios.post(`/logs/${this.label}/terminate`, { ...prompt, service: this.label });
    return logs;
  }

  async clear() {
    const { data: logs } = await axios.delete(`/logs/${this.label}/logs`);
    return logs;
  }

  /**
   * @param {string} msg
   * @param {{force?: boolean}} param0
   */
  async autocomplete(msg, { force } = {}) {
    const { data: logs } = await axios.get(`/logs/${this.label}/autocomplete`, {
      params: { message: msg, force: !!force },
    });
    return logs;
  }

  async openInVsCode(path, editor) {
    return axios.get(`/editors/${this.label}/open-in-vs-code`, { params: { path, editor } });
  }

  /**
   *
   * @param {string} link
   * @returns
   */
  async openLinkInVsCode(link, editor) {
    return axios.get(`/editors/${this.label}/open-link-in-vs-code`, { params: { link, editor } });
  }

  async openFolder(path) {
    return axios.get(`/stack/${this.label}/open-folder`, { params: { path } });
  }

  async restart() {
    this.enabled = true;
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString());
    return axios.get(`/stack/${this.label}/restart`);
  }

  async start() {
    this.enabled = true;
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString());
    return axios.get(`/stack/${this.label}/start`);
  }

  async stop() {
    this.enabled = false;
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString());
    return axios.get(`/stack/${this.label}/stop`);
  }

  async getBranches() {
    const { data: branches } = await axios.get(`/git/${this.label}/branches`);
    return branches;
  }

  async getCurrentBranch() {
    const { data: currentBranch } = await axios.get(`/git/${this.label}/current-branch`);
    return currentBranch;
  }

  /**
   * @param {string} name
   * @param {boolean} shouldPush
   */
  async addBranch(name, shouldPush) {
    const { data: status } = await axios.post(`/git/${this.label}/add-branch`, {
      shouldPush, name,
    });
    return status;
  }

  async getStatus() {
    const { data: status } = await axios.get(`/git/${this.label}/status`);
    return status;
  }

  async getDiff() {
    const { data: diff } = await axios.get(`/git/${this.label}/diff`);
    return diff;
  }

  /**
   *
   * @param {string} branchName
   */
  async changeBranch(branchName) {
    await axios.post(`/git/${this.label}/branch/${encodeURIComponent(branchName)}/change`);
  }

  /**
   *
   * @param {string} branchName
   */
  async deleteBranch(branchName) {
    await axios.delete(`/git/${this.label}/branch/${encodeURIComponent(branchName)}`);
  }

  /**
   *
   * @param {string} branchName
   */
  async gitRemoteDelta(branchName) {
    if (this.git) this.git.delta = null;
    const { data: delta } = await axios.get(`/git/${this.label}/branch/${encodeURIComponent(branchName)}/remote-delta`);
    if (this.git) this.git.delta = delta;
    return delta;
  }

  async gitFetch() {
    await axios.post(`/git/${this.label}/fetch`);
  }

  /**
   *
   * @param {boolean} graphOnAll
   */
  async getGraph(graphOnAll) {
    const { data: graph } = await axios.get(`/git/${this.label}/graph`, {
      params: {
        graphOnAll,
      },
    });
    return graph;
  }

  async reset() {
    await axios.delete(`/git/${this.label}/reset`);
  }

  async stash() {
    await axios.post(`/git/${this.label}/stash`);
    return this.updateGit();
  }

  async stashPop() {
    await axios.post(`/git/${this.label}/stash-pop`);
  }

  async pull() {
    await axios.post(`/git/${this.label}/pull`);
  }

  async stashList() {
    const { data: stash } = await axios.post(`/git/${this.label}/stash-list`);
    return stash;
  }

  /**
   *
   * @param {string} file
   */
  async checkoutFile(file) {
    file = encodeURIComponent(file);
    await axios.delete(`/git/${this.label}/checkout/${file}`);
  }

  async isNpm(cwd) {
    const { data: isNpm } = await axios.get(`/npm/${this.label}`, {
      params: { cwd }
    });
    return isNpm;
  }
  async getNpmPaths() {
    const { data: paths } = await axios.get(`/npm/${this.label}/paths`);
    return paths;
  }

  async getPackageJSON(cwd) {
    const { data: packageJSON } = await axios.get(`/npm/${this.label}/packagejson`, {
      params: {cwd}
    });
    return packageJSON;
  }

  async outdatedNpm(cwd) {
    const { data: outdated } = await axios.get(`/npm/${this.label}/outdated`, {
      params: {cwd}
    });
    return outdated;
  }

  async getBugs(cwd) {
    const { data: bugs } = await axios.get(`/bugs/${this.label}`, {
      params: {cwd}
    });
    return bugs || [];
  }

  async save() {
    await axios.post('/stack/services', this);
    return this;
  }

  /**
   *
   * @param {*} data
   * @returns
   */
  static async getTokens(data) {
    const { data: bugs } = await axios.post('/openai/tokenize', { data });
    return bugs || [];
  }

  /**
   *
   * @param {*} data
   * @returns
   */
  static async reviewFromAi(data) {
    const { data: bugs } = await axios.post('/openai/review', { data });
    return bugs || [];
  }

  /**
   *
   * @param {*} data
   * @returns
   */
  static async findSolutionFromAi(data) {
    const { data: bugs } = await axios.post('/openai/error', { data });
    return bugs || [];
  }

  static async homedir() {
    const { data: path } = await axios.post('/fs/homedir');
    return path || '';
  }
}

export default Service;

/**
 * @typedef {import('../../../../servers/server/models/Service').LogMessage} LogMessage
 */

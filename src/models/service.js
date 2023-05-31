import axios from '../helpers/axios'
class Service {
  /** @param {import('../../typings/index').NonFunctionProperties<Service>} service */
  constructor(service) {
    this.updateFields(service)
  }
  /**
   * @param {import('../../typings/index').NonFunctionProperties<Service>} service} service 
   */
  updateFields(service) {
    if (!service.label) throw new Error('A service should have a label')
    /** @type {string} */
    this.label = service.label
    /** @type {string} */
    this.description = service.description || ''
    /** @type {string} */
    this.url = service.url || ''
    /** @type {string[]} */
    this.groups = service.groups || []
    /** @type {string[]} */
    this.urls = service.urls || []
    /** 
     * @type {{
     *   home: string,
     *   remote: string,
     *   branches: {name: string, merged: boolean, canDelete: boolean, isRemote: boolean}[],
     *   stash: string[],
     *   delta: number | null,
     *   currentBranch: string,
     *   status: []
     * }}
     * */
    this.git = service.git || {
      home: '',
      remote: '',
      branches: [],
      stash: [],
      delta: 0,
      currentBranch: '',
      status: []
    }
    /** @type {string} */
    this.spawnCmd = service.spawnCmd || ''
    /** @type {string[]} */
    this.spawnArgs = service.spawnArgs || []
    /** @type {Record<any, any>} */
    this.spawnOptions = service.spawnOptions || {
      cwd: '',
      env: ''
    }
    /** @type {Array<Record<any, any>>} */
    this.commands = service.commands || []
    /** @type {boolean} */
    this.enabled = service.enabled || false
    /** @type {boolean} */
    this.crashed = service.crashed || false
    /** @type {string} */
    this.rootPath = service.rootPath || ''
  }

  async updateGit() {
    if(this.git) {
      this.git.branches = await this.getBranches()
      this.git.currentBranch = await this.getCurrentBranch()
      this.git.status = await this.getStatus()
      const list = await this.stashList()
      this.git.stash = list
    }
  }


  async fetch() {
    const { data: service } = await axios.get('/stack/' + this.label + '/')
    this.updateFields(service)
    return this
  }

  /** @returns {Promise<LogMessage[]>}*/
  async getLogs() {
    const { data: logs } = await axios.get('/logs/' + this.label + '/logs')
    return logs
  }

  /** @param {{message: string, pid?: number}} prompt */
  async sendTerminalPrompt(prompt) {
    const { data: logs } = await axios.post('/logs/' + this.label + '/prompt', {...prompt, service: this.label})
    return logs
  }

  async clear() {
    const { data: logs } = await axios.delete('/logs/' + this.label + '/logs')
    return logs
  }

  /** @param {string} msg */
  async autocomplete(msg) {
    const { data: logs } = await axios.get('/logs/' + this.label + '/autocomplete', {
      params: { message: msg }
    })
    return logs
  }

  async openInVsCode() {
    return axios.get('/stack/' + this.label + '/open-in-vs-code')
  }

  /**
   * 
   * @param {string} link 
   * @returns 
   */
  async openLinkInVsCode(link) {
    return axios.get('/stack/' + this.label + '/open-link-in-vs-code', { params: { link } })
  }

  async openFolder() {
    return axios.get('/stack/' + this.label + '/open-folder')
  }

  async restart() {
    this.enabled = true
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString())
    return axios.get('/stack/' + this.label + '/restart')
  }
  async start() {
    this.enabled = true
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString())
    return axios.get('/stack/' + this.label + '/start')
  }
  async stop() {
    this.enabled = false
    localStorage.setItem(`automatic-toggle-${this.label}`, this.enabled.toString())
    return axios.get('/stack/' + this.label + '/stop')
  }

  async getBranches() {
    const { data: branches } = await axios.get('/git/' + this.label + '/branches')
    return branches
  }

  async getCurrentBranch() {
    const { data: currentBranch } = await axios.get('/git/' + this.label + '/current-branch')
    return currentBranch
  }
  /**
   * @param {string} name 
   * @param {boolean} shouldPush 
   */
  async addBranch(name, shouldPush) {
    const { data: status } = await axios.post('/git/' + this.label + '/add-branch', {
      shouldPush, name
    })
    return status
  }

  async getStatus() {
    const { data: status } = await axios.get('/git/' + this.label + '/status')
    return status
  }

  async getDiff() {
    const { data: diff } = await axios.get('/git/' + this.label + '/diff')
    return diff
  }

  /**
   * 
   * @param {string} branchName 
   */
  async changeBranch(branchName) {
    await axios.post('/git/' + this.label + '/branch/' + encodeURIComponent(branchName) + '/change')
  }

  /**
   * 
   * @param {string} branchName 
   */
  async deleteBranch(branchName) {
    await axios.delete('/git/' + this.label + '/branch/' + encodeURIComponent(branchName))
  }
  /**
   * 
   * @param {string} branchName 
   */
  async gitRemoteDelta(branchName) {
    if (this.git) this.git.delta = null
    const { data: delta } = await axios.get(`/git/${this.label}/branch/${encodeURIComponent(branchName)}/remote-delta`)
    if (this.git) this.git.delta = delta
    return delta
  }
  async gitFetch() {
    await axios.post(`/git/${this.label}/fetch`)
  }

  /**
   * 
   * @param {boolean} graphOnAll 
   */
  async getGraph(graphOnAll) {
    const {data: graph} = await axios.get(`/git/${this.label}/graph`, {
      params: {
        graphOnAll
      }
    })
    return graph
  }

  async reset() {
    await axios.delete('/git/' + this.label + '/reset')
  }
  async stash() {
    await axios.post('/git/' + this.label + '/stash')
    return this.updateGit()
  }
  async stashPop() {
    await axios.post('/git/' + this.label + '/stash-pop')
  }
  async pull() {
    await axios.post('/git/' + this.label + '/pull')
  }
  async stashList() {
    const { data: stash } = await axios.post('/git/' + this.label + '/stash-list')
    return stash
  }

  /**
   * 
   * @param {string} file 
   */
  async checkoutFile(file) {
    file = encodeURIComponent(file)
    await axios.delete('/git/' + this.label + '/checkout/' + file)
  }

  async isNpm() {
    const { data: isNpm } = await axios.get('/npm/' + this.label)
    return isNpm
  }

  async getPackageJSON() {
    const { data: packageJSON } = await axios.get('/npm/' + this.label + '/packagejson')
    return packageJSON
  }

  async outdatedNpm() {
    const { data: outdated } = await axios.get('/npm/' + this.label + '/outdated')
    return outdated
  }

  /**
   * 
   * @param {string} command 
   */
  async runNpmCommand(command) {
    const { data: socket } = await axios.get('/npm/' + this.label + '/run/' + encodeURIComponent(command))
    return socket
  }
  async getBugs() {
    const { data: bugs } = await axios.get('/bugs/' + this.label)
    return bugs || []
  }
  /**
   * 
   * @param {*} data 
   * @returns 
   */
  static async getTokens(data) {
    const { data: bugs } = await axios.post('/openai/tokenize', { data })
    return bugs || []
  }
  /**
   * 
   * @param {*} data 
   * @returns 
   */
  static async reviewFromAi(data) {
    const { data: bugs } = await axios.post('/openai/review', { data })
    return bugs || []
  }
  /**
   * 
   * @param {*} data 
   * @returns 
   */
  static async findSolutionFromAi(data) {
    const { data: bugs } = await axios.post('/openai/error', { data })
    return bugs || []
  }
}


export default Service

/**
 * @typedef {import('../../server/models/Service').LogMessage} LogMessage
 */
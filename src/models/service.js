import axios from '../helpers/axios'
class Service {
  /** @param {Service | {[key: string]: any}} service */
  constructor(service) {
    this.updateFields(service)
  }
  updateFields(service = {}) {
    if (!service.label) throw new Error('A service should have a label')
    this.label = service.label
    this.description = service.description || ''
    this.url = service.url || ''
    this.git = service.git || {
      home: '',
      remote: '',
      branches: [],
      stash: [],
      delta: 0,
      status: []
    }
    this.spawnCommand = service.spawnCommand || ''
    this.spawnOptions = service.spawnOptions || {
      cwd: '',
      env: ''
    }
    this.enabled = service.enabled || false
  }
  async updateGit() {
    this.git.branches = await this.getBranches()
    this.git.status = await this.getStatus()
    const branch = this.getCurrentBranch()
    if (branch) {
      this.git.delta = await this.gitRemoteDelta(branch)
    }
    const list = await this.stashList()
    this.git.stash = list
  }

  getCurrentBranch() {
    const branch = this.git.branches.filter(_branch => _branch.includes('*')).pop()
    return branch ? branch.replace(/^\* /gm, '') : null
  }

  async fetch() {
    const {data: service} = await axios.get('/stack/' + this.label + '/')
    this.updateFields(service)
    if(this.enabled) return this.restart()
    return this
  }
  
  async getLogs() {
    const {data: logs} = await axios.get('/stack/'+this.label+'/logs')
    return logs
  }
  
  async clear() {
    const {data: logs} = await axios.delete('/stack/'+this.label+'/logs')
    return logs
  }
  
  async openInVsCode () {
    return axios.get('/stack/' + this.label + '/open-in-vs-code')
  }
  
  async openFolder () {
    return axios.get('/stack/' + this.label + '/open-folder')
  }
  
  async restart () {
    this.enabled = true
    return axios.get('/stack/' + this.label + '/restart')
  }
  async start () {
    this.enabled = true
    return axios.get('/stack/' + this.label + '/start')
  }
  async stop () {
    this.enabled = false
    return axios.get('/stack/' + this.label + '/stop')
  }
  
  async getBranches () {
    const { data: branches } = await axios.get('/git/' + this.label + '/branches')
    return branches
  }
  
  async getStatus () {
    const { data: status } = await axios.get('/git/' + this.label + '/status')
    return status
  }
  
  async changeBranch(branchName) {
    await axios.post('/git/' + this.label + '/branch/' + branchName + '/change')
  }
  async gitRemoteDelta(branchName) {
    const { data: delta } = await axios.get(`/git/${this.label}/branch/${branchName}/remote-delta`)
    return delta
  }
  async gitFetch() {
    await axios.post(`/git/${this.label}/fetch`)
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
  
  async checkoutFile(file) {
    file = encodeURIComponent(file)
    await axios.delete('/git/' + this.label + '/checkout/' + file)
  }
  
  async isNpm () {
    const { data: isNpm } = await axios.get('/npm/' + this.label)
    return isNpm
  }
  
  async getPackageJSON () {
    const { data: packageJSON } = await axios.get('/npm/' + this.label + '/packagejson')
    return packageJSON
  }
  
  async runNpmCommand(command) {
    const { data: socket } = await axios.get('/npm/' + this.label + '/run/' + encodeURIComponent(command))
    return socket
  }
  async getBugs() {
    const { data: bugs } = await axios.get('/bugs/' + this.label)
    return bugs || []
  }
}


export default Service
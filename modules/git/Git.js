const { existsSync } = require('fs-extra')
const { execAsync, execAsyncWithoutErr } = require('../../server/helpers/exec')
const pathfs = require('path')

/** @param {import('../../typings/index').StackMonitor} stackMonitor */
const Git = (stackMonitor) => {
  const {findService} = stackMonitor
  /** @param {import('../../server/models/Service')} service */
  function requirements(service) {
    if (!service) return false
    if (!service.git) return false
    if (!service.rootPath) return false
    if (!existsSync(service.rootPath)) return false
    return existsSync(pathfs.resolve(service.rootPath, '.git'))
  }
  return {
    /**
     * @param {string} serviceName 
     * @param {{graphOnAll?: boolean}} param1 
     */
    async getGraph(serviceName, {graphOnAll} = {}) {
      const service = findService(serviceName)
      if (!requirements(service)) return []
      const cmd = `git -c color.ui=always log  --decorate=full --oneline --graph ${(graphOnAll ? '--all' : '')} -500`;
      const result = await execAsync(cmd, { cwd: service.rootPath, env: process.env });
      return result.split('\n')
    },
    /** @param {string} serviceName */
    async getBranches(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) return []
      const unmergeableBranches = ['dev', 'develop', 'main', 'master']
      const currentBranch = await this.getCurrentBranch(service.label)
      const mergedBranches = await execAsyncWithoutErr(`git branch --merged develop`, { cwd: service.rootPath })
        .then((branches) => branches.trim().split('\n').map(a => a.replace('*', '').trim()))
      return execAsyncWithoutErr('git branch', { cwd: service.rootPath })
        .then((res) => res.toString().trim().split('\n').map(a => {
          const name = a.replace('*', '').trim()
          return {
            name,
            merged: mergedBranches.includes(name) && !unmergeableBranches.includes(name) && currentBranch !== name
          }
        }))
    },
    /**
     * 
     * @param {string} serviceName 
     * @returns 
     */
    async getCurrentBranch(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) return ''
      return (await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: service.rootPath }))?.trim()
    },
    /** @param {string} serviceName */
    async getStatus(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) return []
      return execAsyncWithoutErr('git status -s', { cwd: service.rootPath })
        .then((res) => res.toString().trim().split('\n')?.filter(a => a))
    },
    /** @param {string} serviceName */
    async getDiff(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) return ''
      return await execAsync(`git diff --minimal`, { cwd: service.rootPath })
    },
    /** 
     * @param {string} serviceName
     * @param {string} branchName
     */
    async changeBranch(serviceName, branchName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git checkout ' + branchName, { cwd: service.rootPath })
      return 'ok'
    },
    /**
     * @param {string} serviceName
     * @param {string} branchName
     */
    async deleteBranch(serviceName, branchName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git branch --delete ' + branchName, { cwd: service.rootPath })
      return 'ok'
    },
    /**
     * @param {string} serviceName
     * @param {string} branchName
     */
    async remoteDelta(serviceName, branchName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      if (service.git.remote) {
        const hasRemote = +(await execAsync(`git ls-remote --heads ${service.git.remote} ${branchName} | wc -l`, { cwd: service.rootPath }))
        if(!hasRemote) return 1
      }
      await execAsync(`git branch --set-upstream-to=origin/${branchName} ${branchName}`, { cwd: service.rootPath })
      await execAsync(`git fetch origin ${branchName}`, { cwd: service.rootPath })
      const localCommit = await execAsync(`git log --oneline ${branchName}`, { cwd: service.rootPath })
      const remoteCommit = await execAsync(`git log --oneline origin/${branchName}`, { cwd: service.rootPath })
      return localCommit.trim().split("\n").length - remoteCommit.trim().split("\n").length
    },
    /** @param {string} serviceName */
    async fetch(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync(`git fetch`, { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async reset(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git reset --hard', { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async pull(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      const origin = (await execAsync('git remote -v | grep fetch', { cwd: service.rootPath })).split('\t')[0]?.trim() || ''
      const currentBranch = await this.getCurrentBranch(service.label)
      await execAsync(`git pull ${origin} ${currentBranch}`, { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async push(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      const origin = (await execAsync('git remote -v | grep fetch', { cwd: service.rootPath })).split('\t')[0]?.trim() || ''
      const currentBranch = await this.getCurrentBranch(service.label)
      await execAsync(`git push ${origin} ${currentBranch}`, { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async stash(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git add .', { cwd: service.rootPath })
      await execAsync('git stash', { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async stashPop(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git stash pop', { cwd: service.rootPath })
      await execAsync('git reset HEAD', { cwd: service.rootPath })
      return 'ok'
    },
    /** @param {string} serviceName */
    async stashList(serviceName) {
      const service = findService(serviceName)
      if (!requirements(service)) return ''
      const list = await execAsync('git stash show', { cwd: service.rootPath })
        .catch(() => '')
      return list
    },
    /**
     * @param {string} serviceName 
     * @param {string} filePath 
     */
    async checkoutFile(serviceName, filePath) {
      const service = findService(serviceName)
      if (!requirements(service)) throw new Error('Requirments not met')
      await execAsync('git checkout ' + filePath, { cwd: service.rootPath })
      return 'ok'
    },
  }
}

module.exports = Git
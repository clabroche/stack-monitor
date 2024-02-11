const { existsSync } = require('fs');
const pathfs = require('path');
const { execAsync, execAsyncWithoutErr } = require('../../../servers/server/helpers/exec');

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
const Git = (stackMonitor) => {
  const { findService } = stackMonitor;
  /** @param {import('../../../servers/server/models/Service')} service */
  async function requirements(service) {
    if (!service) throw new Error('Git Error: Service not found');
    if (!service.git) throw new Error(`Git Error - ${service?.label}: Git option not set`);
    if (!service.rootPath) throw new Error(`Git Error - ${service?.label}: Root Path option not set`);
    if (!existsSync(service.rootPath)) throw new Error(`Git Error - ${service?.label}: Root Path option not exists on disk`);
    if (!existsSync(pathfs.resolve(service.rootPath, '.git'))) return false;
    return true;
  }
  return {
    /**
     * @param {string} serviceName
     * @param {{graphOnAll?: boolean}} param1
     */
    async getGraph(serviceName, { graphOnAll } = {}) {
      const service = findService(serviceName);
      if (!await requirements(service)) return [];
      const cmd = `git -c color.ui=always log  --decorate=full --oneline --graph ${(graphOnAll ? '--all' : '')} -500`;
      const result = await execAsync(cmd, { cwd: service.rootPath, env: process.env });
      return result.split('\n');
    },
    /** @param {string} serviceName */
    async getBranches(serviceName, fetch = false) {
      const service = findService(serviceName);
      if (!await requirements(service)) return [];
      if (fetch) await this.fetch(serviceName);
      const origin = await this.getOrigin(serviceName);
      const unmergeableBranches = ['dev', 'develop', 'main', 'master'];
      const currentBranch = await this.getCurrentBranch(service.label);
      const mergedBranches = await execAsyncWithoutErr('git branch --no-color --merged develop', { cwd: service.rootPath })
        .then((branches) => branches.trim().split('\n').map((a) => a.replace('*', '').trim()));
      const localBranches = await execAsyncWithoutErr('git branch --no-color', { cwd: service.rootPath })
        .then((res) => res.toString().trim().split('\n').map((branch) => {
          const name = branch.replace('*', '').trim();
          return {
            name,
            isRemote: false,
            isCurrentBranch: currentBranch === name,
            canDelete: !unmergeableBranches.includes(name) && currentBranch !== name,
            merged: mergedBranches.includes(name) && !unmergeableBranches.includes(name) && currentBranch !== name,
          };
        }));
      const remoteBranches = await execAsyncWithoutErr('git branch --no-color -r', { cwd: service.rootPath })
        .then((res) => res.toString().trim().split('\n').map((branch) => {
          const name = branch.replace('*', '').trim();
          return {
            name: name.replace(`${origin}/`, ''),
            isRemote: true,
            canDelete: false,
            merged: false,
          };
        })
          .filter((remoteBranch) => !localBranches.find((localBranch) => remoteBranch.name === localBranch.name)));
      return [
        ...localBranches,
        ...remoteBranches,
      ];
    },
    /** @param {string} serviceName */
    async getCurrentBranch(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return '';
      return (await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: service.rootPath }))?.trim();
    },
    /**
     *
     * @param {string} serviceName
     * @param {string} branchName
     * @param {boolean} shouldPush
     * @returns
     */
    async addBranch(serviceName, branchName, shouldPush = false) {
      if (!branchName) throw new Error('Branch name is empty');
      const service = findService(serviceName);
      if (!await requirements(service)) return '';
      const res = (await execAsync(`git checkout -b ${branchName}`, { cwd: service.rootPath }))?.trim();
      if (shouldPush) await this.push(serviceName);
      return res;
    },
    /** @param {string} serviceName */
    async getStatus(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return [];
      return execAsyncWithoutErr('git -c color.status=no status -s', { cwd: service.rootPath })
        .then((res) => res.toString().trim().split('\n')?.filter((a) => a));
    },
    /** @param {string} serviceName */
    async getDiff(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return '';
      return execAsync('git diff --minimal', { cwd: service.rootPath });
    },
    /**
     * @param {string} serviceName
     * @param {string} branchName
     */
    async changeBranch(serviceName, branchName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync(`git checkout ${branchName}`, { cwd: service.rootPath });
      return 'ok';
    },
    /**
     * @param {string} serviceName
     * @param {string} branchName
     */
    async deleteBranch(serviceName, branchName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync(`git branch --delete ${branchName}`, { cwd: service.rootPath });
      return 'ok';
    },
    /**
     * @param {string} serviceName
     * @param {string} branchName
     */
    async remoteDelta(serviceName, branchName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 0;
      const upstream = await execAsync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { cwd: service.rootPath }).catch(() => {});
      if (!upstream) {
        await execAsync(`git branch --set-upstream-to=origin/${branchName} ${branchName}`, { cwd: service.rootPath }).catch(() => {});
        return 1;
      }
      await execAsync(`git fetch origin ${branchName}`, { cwd: service.rootPath });
      const localCommit = await execAsync(`git log --oneline ${branchName}`, { cwd: service.rootPath });
      const remoteCommit = await execAsync(`git log --oneline origin/${branchName}`, { cwd: service.rootPath });
      return localCommit.trim().split('\n').length - remoteCommit.trim().split('\n').length;
    },
    /** @param {string} serviceName */
    async fetch(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync('git fetch', { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async reset(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync('git reset --hard', { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async pull(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      const origin = await this.getOrigin(serviceName);
      const currentBranch = await this.getCurrentBranch(service.label);
      await execAsync(`git pull ${origin} ${currentBranch}`, { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async getOrigin(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return '';
      return (await execAsync('git remote -v', { cwd: service.rootPath })).trim().split('\n').find((a) => a?.includes('fetch'))?.split('\t')[0]?.trim() || '';
    },
    /** @param {string} serviceName */
    async push(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      const origin = await this.getOrigin(serviceName);
      const currentBranch = await this.getCurrentBranch(service.label);
      await execAsync(`git push ${origin} ${currentBranch}`, { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async stash(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync('git add .', { cwd: service.rootPath });
      await execAsync('git stash', { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async stashPop(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync('git stash pop', { cwd: service.rootPath });
      await execAsync('git reset HEAD', { cwd: service.rootPath });
      return 'ok';
    },
    /** @param {string} serviceName */
    async stashList(serviceName) {
      const service = findService(serviceName);
      if (!await requirements(service)) return '';
      const list = await execAsync('git stash show', { cwd: service.rootPath })
        .catch(() => '');
      return list;
    },
    /**
     * @param {string} serviceName
     * @param {string} filePath
     */
    async checkoutFile(serviceName, filePath) {
      const service = findService(serviceName);
      if (!await requirements(service)) return 'ko';
      await execAsync(`git checkout ${filePath}`, { cwd: service.rootPath });
      return 'ok';
    },
  };
};

module.exports = Git;

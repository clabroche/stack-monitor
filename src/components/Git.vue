<template>
  <div class="git-section" v-if="currentService.git">
    <section-cmp v-if="git.branches"
      :key="currentService.label"
      header="Branches"
      :noStyle="noStyle"
      :actions="[{label: 'Pull ' +'('+delta+')', hidden: delta >= 0, click: () => pull(), icon: 'fas fa-download'}]">
      <ul class="branches">
        <li v-for="(branch, i) of git.branches" :key="'branch' +i" @click="changeBranch(branch)" :class="{active: branch.includes('*')}">
          {{branch.replace(/^\* /gm, '')}} <i class="fas fa-chevron-right"  aria-hidden="true"></i>
        </li>
      </ul>
    </section-cmp>
    <section-cmp v-if="git.status" header="Status" :noStyle="noStyle" :actions="[
      {label: 'Stash', click: () => stash(), icon: 'fas fa-sun',hidden: git.stash || !git.status.filter(a =>a).length},
      {label: 'Unstash', click: () => stashPop(), icon: 'far fa-sun', hidden: !git.stash},
      {label: 'Reset', click: () => reset(), icon: 'fas fa-eraser'}
      ]">
      <ul v-if="git.status.filter(a =>a).length">
        <li v-for="(status, i) of git.status" :key="'status-' + i" @click="checkoutFile(status)">
          <span v-html="colorStatus(status)"></span>
          <i class="fas fa-times" aria-hidden="true"></i>
        </li>
      </ul>
      <div v-else class="check">
        <i class="fas fa-check" aria-hidden="true"></i>
      </div>
    </section-cmp>
  </div>
  <modal ref="reset-modal" cancelString="No" validateString="Yes">
    <template #header>
      Reset
    </template>
    <template #body>
      Do you really want to launch "git reset --hard" on this repository ?
    </template>
  </modal>
  <modal ref="checkout-modal" cancelString="No" validateString="Yes">
    <template #header>
      Checkout
    </template>
    <template #body="{data: file}">
      Do you really want to launch "git checkout {{file}}" on this repository ?
    </template>
  </modal>
  <modal ref="branch-modal" cancelString="No" validateString="Yes">
    <template #header>
      Branch change
    </template>
    <template #body="{data:branchName}">
      Do you really want to change branch to "{{branchName}}" on this repository ?
    </template>
  </modal>
  <modal ref="error-modal" :noActions="true">
    <template #header>
      Erreur
    </template>
    <template #body="{data:error}">
      <div v-html="error ? error.replace(/\n/gi, '<br/>') : ''">
      </div>
    </template>
  </modal>
</template>

<script>
import Service from '../models/service'
import ModalVue from './Modal.vue'
import SectionVue from './Section.vue'
export default {
  components: {
    sectionCmp: SectionVue,
    modal: ModalVue
  },
  props: {
    noStyle: {default: false},
    currentService: {
      /** @type {import('../models/service').default}*/
      default: null,
      required: true,
      type: Service
    },
  },
  data() {
    return {
      git: {
        branches: [],
        status: [],
        stash: null
      },
      delta: 0
    }
  },
  async mounted() {
    this.updateGit()
    this.currentService.gitFetch()
    this.interval = setInterval(this.updateGit, 1000)
    this.longInterval = setInterval(() => this.currentService.gitFetch(), 1000 * 60)
  },
  beforeUnmount() {
    clearInterval(this.interval)
    clearInterval(this.longInterval)
  },
  methods: {
    getCurrentBranch() {
      const branch = this.git.branches.filter(_branch => _branch.includes('*')).pop()
      return branch ? branch.replace(/^\* /gm, '') : null
    },
    colorStatus(status) {
      status = status.trim()
      if(status.charAt(0) === 'D') {
        status = '<span style="color: #ff7f7f; font-weight: bold">D</span>' + status.slice(1) 
      }
      if(status.charAt(0) === 'M') {
        status = '<span style="color: #ffe47f; font-weight: bold">M</span>' + status.slice(1) 
      }
      if(status.charAt(0) === '?') {
        status = '<span style="color: #7fe1ff; font-weight: bold">??</span>' + status.slice(2) 

      }
      return status
    },
    async updateGit() {
      this.git.branches = await this.currentService.getBranches(this.currentService.label)
      this.git.status = await this.currentService.getStatus(this.currentService.label)
      const branch = this.getCurrentBranch()
      if(branch) {
        this.delta = await this.currentService.gitRemoteDelta(branch)
      }
      this.stashList()
    },
    async changeBranch(branchName) {
      branchName = branchName.trim()
      const res = await this.$refs['branch-modal'].open(branchName).promise
      if(res) {
        await this.currentService.changeBranch(branchName)
          .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
        await this.updateGit()
      }
    },
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ')
      const res = await this.$refs['checkout-modal'].open(file).promise
      if(res) {
        return this.currentService.checkoutFile(file)
          .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
      }
    },
    async reset() {
      const res = await this.$refs['reset-modal'].open().promise
      if(res) {
        return this.currentService.reset()
          .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
      }
    },
    async stash() {
      await this.currentService.stash()
        .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
      return this.updateGit()
    },
    async stashPop() {
      await this.currentService.stashPop()
        .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
      return this.updateGit()
    },
    async pull() {
      await this.currentService.pull()
        .catch(err=> this.$refs['error-modal'].open(err.response.data).promise)
      return this.updateGit()
    },
    async stashList() {
      const list = await this.currentService.stashList()
      this.git.stash = list
    },
  }
}
</script>

<style lang="scss" scoped>
.git-section {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: auto;
  height: 100%;
  max-height: 240px;
  overflow: hidden;
  
  &>div {
    &:first-of-type {
      margin-right: 5px
    }
    &:last-of-type {
      margin-left: 5px
    }
  }
  .check {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.5em;
    color: green;
  }
  ul {
    margin: 0;
    padding: 0;
    li {
      border-left: 1px solid lightgrey;
      padding: 0;
      padding-left: 10px;
      transition: 300ms;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none;
      margin: 0;
      cursor: pointer;
      &.active {
        border-left: 3px solid #0076bc;
      }
      i {
        transition: 300ms;
        opacity: 0;
        margin: 0 3px
      }
      &:hover {
        background-color: rgba(0,0,0,0.05);
        i {
          opacity: 1;
        }
      }
    }
  }
}
</style>
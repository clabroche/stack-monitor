<template>
  <div class="git-section" v-if="currentService.git">
    <section-cmp v-if="git.branches" class="section-branches"
      :key="currentService.label"
      header="Branches"
      :noStyle="noStyle"
      :actions="[{label: 'Pull ' +'('+git.delta+')', hidden: git.delta >= 0, click: () => pull(), icon: 'fas fa-download'}]">
      <ul class="branches">
        <li v-for="(branch, i) of git.branches" :key="'branch' +i" @click="changeBranch(branch)" :class="{active: branch.includes('*')}">
          {{branch.replace(/^\* /gm, '')}} <i class="fas fa-chevron-right"  aria-hidden="true"></i>
        </li>
      </ul>
    </section-cmp>
    <section-cmp v-if="git.status" header="Status" :noStyle="noStyle" :actions="[
      {label: 'Stash', click: () => stash(), icon: 'fas fa-sun',hidden: !git.status.filter(a =>a).length},
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
</template>

<script>
import notification from '../helpers/notification'
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
    customGit: {default: null},
    currentService: {
      /** @type {import('../models/service').default}*/
      default: null,
      required: true,
      type: Service
    },
  },
  computed: {
    git() {
      return this.currentService.git
    }
  },
  data() {
    return {
      interval:null,
      longInterval:null,
    }
  },
  async mounted() {
    if(this.customGit) return 
    this.currentService.updateGit()
    this.gitFetch()
    this.interval = setInterval(() => this.currentService.updateGit(), 1000)
    this.longInterval = setInterval(() => this.gitFetch(), 1000 * 60)
  },
  beforeUnmount() {
    clearInterval(this.interval)
    clearInterval(this.longInterval)
  },
  methods: {
    gitFetch() {
      this.currentService.gitFetch()
        .catch((err) => notification.next('error', err?.response?.data || err?.message || err))
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
    async changeBranch(branchName) {
      branchName = branchName.trim()
      // @ts-ignore
      const res = await this.$refs['branch-modal'].open(branchName).promise
      if(res) {
        await this.currentService.changeBranch(branchName)
          .then(() => notification.next('success', `Branch is now on ${branchName}`))
          .catch(err=> notification.next('error', err.response.data))
        await this.currentService.updateGit()
      }
    },
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ')
      // @ts-ignore
      const res = await this.$refs['checkout-modal'].open(file).promise
      if(res) {
        return this.currentService.checkoutFile(file)
          .then(() => notification.next('success', `Changes on ${file} are deleted`))
          .catch(err=> notification.next('error', err.response.data))
      }
    },
    async reset() {
      // @ts-ignore
      const res = await this.$refs['reset-modal'].open().promise
      if(res) {
        return this.currentService.reset()
          .then(() => notification.next('success', `All changes are lost`))
          .catch(err=> notification.next('error', err.response.data))
      }
    },
    async stash() {
      await this.currentService.stash()
          .then(() => notification.next('success', `All changes is in stash`))
        .catch(err=> notification.next('error', err.response.data))
      return this.currentService.updateGit()
    },
    async stashPop() {
      await this.currentService.stashPop()
          .then(() => notification.next('success', `All changes unstashed`))
        .catch(err=> notification.next('error', err.response.data))
      return this.currentService.updateGit()
    },
    async pull() {
      await this.currentService.pull()
          .then(() => notification.next('success', `Branch is now up to date`))
        .catch(err=> notification.next('error', err.response.data))
      return this.currentService.updateGit()
    },
  }
}
</script>

<style lang="scss" scoped>
.section-branches {
  z-index: 1;
}
.git-section {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: auto;
  height: 100%;
  max-height: 240px;
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
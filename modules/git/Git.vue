<template>
  <button @click="openReview">Review from AI</button>
  <div class="git-section" v-if="service.git">
    <section-cmp v-if="git && git.branches" class="section-branches"
      :key="service.label"
      header="Branches"
      :noStyle="noStyle"
      :actions="[
        { label: '', hidden: git.delta == null, click: () => gitFetch(), icon: 'fas fa-sync' },
        { label: pullLabel, hidden: git.delta != null && git.delta >= 0, click: () => pull(), icon: 'fas fa-download' }
      ]">
      <!-- Base branch: 
      <select v-model="defaultBranch">
        <option></option>
        <option v-for="branch of git.branches" :key="branch?.name" :default="defaultBranch === branch?.name">{{ branch?.name }}</option>
      </select> -->
      <ul class="branches">
        <li v-for="(branch, i) of git.branches" :key="'branch' +i" @click="changeBranch(branch?.name)" :class="{
          active: branch?.name === service?.git?.currentBranch,
          merged: branch?.merged
        }">
          <div class="actions">
            <div v-if="branch?.merged === true" title="Already merged into develop">
              <i class="fas fa-object-group" aria-hidden="true"></i>
            </div>
            {{branch?.name}}
          </div>
          <div class="actions">
            <button class="small" @click.stop="deleteBranch(branch?.name)" v-if="!['dev', 'develop', 'main','master'].includes(branch?.name)">
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </li>
      </ul>
    </section-cmp>
    <section-cmp v-if="git?.status" class="section-status" header="Status" :noStyle="noStyle" :actions="[
      {label: 'Stash', click: () => stash(), icon: 'fas fa-sun',hidden: !git.status.filter(a =>a).length},
      {label: 'Unstash', click: () => stashPop(), icon: 'far fa-sun', hidden: !git.stash},
      {label: 'Reset', click: () => reset(), icon: 'fas fa-eraser'}
      ]">
      <ul v-if="git.status.filter(a =>a).length">
        <li v-for="(status, i) of git.status" :key="'status-' + i">
          <span v-html="colorStatus(status)"></span>
          <div class="actions">
            <i class="fas fa-external-link-alt" aria-hidden="true" @click.stop="openInVsCode(status)"></i>
            <i class="fas fa-times" aria-hidden="true" @click.stop="checkoutFile(status)"></i>
          </div>
        </li>
      </ul>
      <div v-else class="check">
        <i class="fas fa-check" aria-hidden="true"></i>
      </div>
    </section-cmp>
  </div>
  <div class="loader" v-if="loader">
    <i class="fas fa-spinner"></i>
  </div>
  <section-cmp class="section-branches">
    <div>
      Afficher toutes les branches: 
      <input type="checkbox" v-model="graphOnAll" @change="updateGraph">
    </div>
    <div class="input-container">
      <i class="fas fa-search"></i>
      <input type="text" v-model="search" placeholder="Search..." @keypress.enter="nextSearch">
      <div>
        <button @click="previousSearch"><i class="fas fa-chevron-up"></i></button>
        <button @click="nextSearch"><i class="fas fa-chevron-down"></i></button>
      </div>
    </div>
    <div ref="terminalRef"></div>
  </section-cmp>
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
    <modal ref="branch-delete-modal" cancelString="No" validateString="Yes">
    <template #header>
      Branch delete
    </template>
    <template #body="{data:branchName}">
      Do you really want to delete branch "{{branchName}}" on this repository ?
    </template>
  </modal>
  <modal ref="review-modal" cancelString="No" validateString="Yes">
    <template #header>
      Review from AI
    </template>
    <template #body="{data: tokens}">
      Are you sure ? This have a cost of ~{{ tokens.price }}$
    </template>
  </modal>

  <modal ref="review-result" cancelString="OK" :noValidate="true">
    <template #header>
      Review from AI
    </template>
    <template #body="{data: result}">
      <pre>
        {{result?.trim()}}
      </pre>
    </template>
  </modal>
</template>

<script>
import notification from '@/helpers/notification'
import Service from '@/models/service'
import ModalVue from '@/components/Modal.vue'
import SectionVue from '@/components/Section.vue'
// @ts-ignore
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import { CanvasAddon } from 'xterm-addon-canvas';
import { SearchAddon } from 'xterm-addon-search';

export default {
  components: {
    sectionCmp: SectionVue,
    modal: ModalVue
  },
  props: {
    noStyle: {default: false},
    customGit: {default: null},
    service: {
      /** @type {import('@/models/service').default | null}*/
      default: null,
      required: true,
      type: Service
    },
  },
  computed: {
    /** @return {import('@/models/service').default['git']} */
    git() {
      return this.service.git
    },
    /** @return {string} */
    pullLabel() {
      if(this.git?.delta == null) return 'Search...' 
      return 'Pull ' + '(' + (this.git.delta || 0) + ')'
    },
  },
  data() {
    return {
      /** @type {number | null} */
      interval: null,
      /** @type {number | null} */
      longInterval:null,
      /** @type {import('xterm').Terminal | null} */
      terminal: null,
      loader: false,
      graphOnAll: false,
      /** @type {string | null} */
      defaultBranch: null,
      search: '',
      /** @type {import('xterm-addon-search').SearchAddon | null} */
      terminalSearch: null
    }
  },
  async mounted() {
    if(this.customGit) return 
    await this.service.updateGit()
    if(!this.defaultBranch) {
      const branchNames = this.service.git?.branches?.map(a => a.name) || []
      if (branchNames.includes('develop')) this.defaultBranch = 'develop'
      else if (branchNames.includes('dev')) this.defaultBranch = 'dev'
      else if (branchNames.includes('master')) this.defaultBranch = 'master'
      else if (branchNames.includes('main')) this.defaultBranch = 'main'
    }
    // @ts-ignore
    this.interval = setInterval(() => this.service.updateGit(), 1000)
    // @ts-ignore
    this.longInterval = setInterval(() => this.gitFetch(), 1000 * 60)
    const commandRef = /** @type {HTMLElement}*/(this.$refs.terminalRef)
    commandRef.innerHTML = ''
    this.terminal = new Terminal({
      smoothScrollDuration: 100,
      experimentalCarAtlas: 'static',
      fontFamily: 'MesloLGS NF, monospace',
      convertEol: true,
      disableStdin: true,
      fontSize: 13,
      allowTransparency: true,
      minimumContrastRatio: 7,
      theme: {
        background: '#ffffff00',
        foreground: '#4c4c4c',
        selectionBackground: '#1d95db',
        selectionForeground: 'white'
      }
    });
    const fitAddon = new FitAddon();
    if(this.terminal) {
      this.terminal.loadAddon(fitAddon);
      this.terminal.loadAddon(new CanvasAddon());
      const searchAddon = new SearchAddon();
      this.terminalSearch = searchAddon
      this.terminal.loadAddon(searchAddon);
      this.terminal.open(commandRef);
      fitAddon.activate(this.terminal)
      fitAddon.fit();
    }
    await this.updateGraph()
    await this.gitFetch()
  },
  beforeUnmount() {
    clearInterval(this.interval || undefined)
    clearInterval(this.longInterval || undefined)
  },
  methods: {
    /** @param {KeyboardEvent | MouseEvent} ev */
    async nextSearch(ev) {
      if (ev.shiftKey) {
        return this.previousSearch()
      }
      if (this.terminalSearch) {
        this.terminalSearch.findNext(this.search)
      }
    },
    async previousSearch() {
      if (this.terminalSearch) {
        this.terminalSearch.findPrevious(this.search)
      }
    },
    /** @param {string} line */
    openInVsCode(line) {
      const path = line.trim().split(' ').slice(1).join(' ')
      this.service.openLinkInVsCode(path)
    },
    async gitFetch() {
      if(!this.service.git) return
      this.service.git.delta = 0
      await this.service.gitFetch()
        .catch((err) => notification.next('error', err?.response?.data || err?.message || err))
      const currentBranch = await this.service.getCurrentBranch()
      this.service.git.delta = await this.service.gitRemoteDelta(currentBranch)
    },

    async updateGraph() {
      const graph = await this.service.getGraph(this.graphOnAll)
        .catch((err) => notification.next('error', err?.response?.data || err?.message || err))
      if(graph && this.terminal) {
        this.terminal.clear()
        this.terminal.writeln(graph.join('\n'))
        setTimeout(() => {
          if(!this.terminal) return
          this.terminal.scrollToTop()
        });
      }
    },
    /** @param {string} status */
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
    /** @param {string} branchName */
    async changeBranch(branchName) {
      this.loader = true
      try {
        branchName = branchName.trim()
        // @ts-ignore
        const res = await this.$refs['branch-modal'].open(branchName).promise
        if(res) {
          await this.service.changeBranch(branchName)
            .then(() => notification.next('success', `Branch is now on ${branchName}`))
            .catch(err=> notification.next('error', err.response.data))
        }
        this.updateGraph()
      } catch (error) {
        
      } finally {
        this.loader = false
        await this.service.updateGit()
        await this.gitFetch()
      }
    },
    /** @param {string} branchName */
    async deleteBranch(branchName) {
      this.loader = true
      try {
        branchName = branchName.trim()
        // @ts-ignore
        const res = await this.$refs['branch-delete-modal'].open(branchName).promise
        if (res) {
          await this.service.deleteBranch(branchName)
            .then(() => notification.next('success', `Branch ${branchName} is deleted`))
            .catch(err => notification.next('error', err.response.data))
        }
        await this.service.updateGit()
        this.updateGraph()
      } catch (error) {

      } finally {
        this.loader = false
        await this.service.updateGit()
        await this.gitFetch()
      }
    },
    /** @param {string} fileStatus */
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ')
      // @ts-ignore
      const res = await this.$refs['checkout-modal'].open(file).promise
      if(res) {
        await this.service.checkoutFile(file)
          .then(() => notification.next('success', `Changes on ${file} are deleted`))
          .catch(err=> notification.next('error', err.response.data))
        await this.updateGraph()
      }
    },
    async reset() {
      // @ts-ignore
      const res = await this.$refs['reset-modal'].open().promise
      if(res) {
        await this.service.reset()
          .then(() => notification.next('success', `All changes are lost`))
          .catch(err=> notification.next('error', err.response.data))
        await this.updateGraph()
      }
    },
    async openReview() {
      const diff = await this.service.getDiff()
      const tokens = await Service.getTokens(diff)
      // @ts-ignore
      const res = await this.$refs['review-modal'].open(tokens).promise
      if (res) {
        const review = await Service.reviewFromAi(diff)
        // @ts-ignore
        const res = await this.$refs['review-result'].open(review).promise
      }
    },
    async stash() {
      await this.service.stash()
          .then(() => notification.next('success', `All changes is in stash`))
        .catch(err=> notification.next('error', err.response.data))
      return this.service.updateGit()
    },
    async stashPop() {
      await this.service.stashPop()
          .then(() => notification.next('success', `All changes unstashed`))
        .catch(err=> notification.next('error', err.response.data))
      return this.service.updateGit()
    },
    async pull() {
      await this.service.pull()
          .then(() => notification.next('success', `Branch is now up to date`))
        .catch(err=> notification.next('error', err.response.data))
      await this.service.updateGit()
      await this.updateGraph()
      await this.gitFetch()
    },
  }
}
</script>

<style lang="scss" scoped>
button {
  position: relative;
  z-index: 2;
}
.section-branches {
  z-index: 1;
  flex-grow: 1;
  width: auto;
  flex-shrink: 0;
  max-width: 100%;
}
.section-status {
  z-index: 1;
  flex-grow: 2;
  width: auto;
  flex-shrink: 0;
  max-width: 100%;
}
.git-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: stretch;
  margin: auto;
  height: 100%;
  gap: 10px;
  &>* {
    max-height: 190px;
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
      .actions {
        display: flex;
        gap: 10px;
      }
      &.active {
        border-left: 3px solid #0076bc;
      }
      button {
        width: max-content;
      }
      button {
        transition: 300ms;
        opacity: 0;
        margin: 0 3px
      }
      &:hover {
        background-color: rgba(0,0,0,0.05);
        button {
          opacity: 1;
        }
      }
    }
  }
}
.loader {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 100000;
  backdrop-filter: blur(10px);
  i {
    font-size: 50px;
    animation: rotation 2s infinite linear;
  }
}
@keyframes rotation {
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(360deg);
  }
}

.input-container {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    border-radius: 10px;
    padding: 5px;
  }

  button {
    height: auto;
    padding: 5px 10px;
  }
}
</style>
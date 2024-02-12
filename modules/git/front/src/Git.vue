<template>
  <div class="git-root">
    <div class="git-section" v-if="service.git">
      <section-cmp v-if="git && git.branches" class="section-branches"
        :key="service.label"
        header="Branches"
        :noStyle="noStyle"
        :actions="[
          { hover: 'Create branch', label: '', click: () => addBranch(), icon: 'fas fa-plus', small: true },
          { hover: 'Fetch all', label: '', click: () => gitFetch(), icon: 'fas fa-sync' },
          {
            hover: 'Pull',
            label: pullLabel,
            hidden: git.delta != null && git.delta >= 0,
            click: () => pull(),
            icon: 'fas fa-download'
          }
        ]">
        <div>
          <input type="text" placeholder="Search branch..." v-model="searchBranch">
        </div>
        <div>
          <input type="checkbox" v-model="displayOnlyLocalBranches">
          Display only local branches
        </div>
        <ul class="branches">
          <li v-for="(branch, i) of displayBranches" :key="'branch' +i"
            @click="branch?.name ? changeBranch(branch.name) : null" :class="{
            active: branch?.name === service?.git?.currentBranch,
            merged: branch?.merged
          }">
            <div class="actions">
              <div v-if="branch?.merged" title="Already merged into develop">
                <i class="fas fa-object-group" aria-hidden="true"></i>
              </div>
              <div v-if="branch?.isRemote" title="Is in remote not local">
                <i class="fas fa-cloud-download-alt" aria-hidden="true"></i>
              </div>
              {{branch?.name}}
            </div>
            <div class="actions">
              <button class="small" @click.stop="branch?.name ? deleteBranch(branch.name) : null" v-if="branch.canDelete">
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </li>
        </ul>
      </section-cmp>
      <section-cmp v-if="git?.status" class="section-status" header="Status" :noStyle="noStyle" :animateActions="true" :actions="[
        {small: true, hover: 'Stash', click: () => stash(), icon: 'fas fa-sun',hidden: !git.status.filter(a =>a).length},
        {small: true, hover: 'Unstash', click: () => stashPop(), icon: 'far fa-sun', hidden: !git.stash},
        {small: true, hover: 'Reset', click: () => reset(), icon: 'fas fa-eraser'},
        {small: true, hover: 'Review from AI', click: () => openReview(), icon: 'fas fa-brain'}
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
    <section-cmp class="section-history">
      <div>
        Display all branches:
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
  <modal ref="add-branch-modal" cancelString="Cancel" validateString="Validate">
    <template #header>
      Add Branch
    </template>
    <template #body="{data:model}">
      <input type="text" v-model="model.name" placeholder="Name of branch">
      <div>
        <input type="checkbox" v-model="model.shouldPush" placeholder="Name of branch">
        Push this branch after creation ?
      </div>
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
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import { CanvasAddon } from 'xterm-addon-canvas';
import { SearchAddon } from 'xterm-addon-search';
import notification from '../../../../fronts/app/src/helpers/notification';
import Service from '../../../../fronts/app/src/models/service';
import ModalVue from '../../../../fronts/app/src/components/Modal.vue';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';
// @ts-ignore

export default {
  components: {
    sectionCmp: SectionVue,
    modal: ModalVue,
  },
  props: {
    noStyle: { default: false },
    customGit: { default: null },
    service: {
      /** @type {import('../../../../fronts/app/src/models/service').default | null} */
      default: null,
      required: true,
      type: Service,
    },
  },
  computed: {
    /** @return {import('../../../../fronts/app/src/models/service').default['git']} */
    git() {
      return this.service.git;
    },
    /** @return {string} */
    pullLabel() {
      if (this.git?.delta == null) return 'Refresh...';
      return `Pull (${this.git.delta || 0})`;
    },
    displayBranches() {
      return (this.git?.branches || [])
        .filter((branch) => branch.name.toUpperCase().includes(this.searchBranch.toUpperCase()))
        .filter((branch) => {
          if (this.displayOnlyLocalBranches) return !branch.isRemote;
          return true;
        });
    },
  },
  data() {
    return {
      /** @type {number | null} */
      interval: null,
      /** @type {number | null} */
      longInterval: null,
      /** @type {import('xterm').Terminal | null} */
      terminal: null,
      loader: false,
      graphOnAll: false,
      /** @type {string | null} */
      defaultBranch: null,
      search: '',
      /** @type {import('xterm-addon-search').SearchAddon | null} */
      terminalSearch: null,
      displayOnlyLocalBranches: true,
      searchBranch: '',
    };
  },
  async mounted() {
    if (this.customGit) return;
    const commandRef = /** @type {HTMLElement} */(this.$refs.terminalRef);
    if (!commandRef) return;
    // @ts-ignore
    this.interval = setInterval(() => this.service.updateGit(), 1000);
    // @ts-ignore
    this.longInterval = setInterval(() => this.gitFetch(), 1000 * 60);
    await this.service.updateGit();
    if (!this.defaultBranch) {
      const branchNames = this.service.git?.branches?.map((/** @type {*} */a) => a.name) || [];
      if (branchNames.includes('develop')) this.defaultBranch = 'develop';
      else if (branchNames.includes('dev')) this.defaultBranch = 'dev';
      else if (branchNames.includes('master')) this.defaultBranch = 'master';
      else if (branchNames.includes('main')) this.defaultBranch = 'main';
    }
    commandRef.innerHTML = '';
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
        selectionForeground: 'white',
      },
    });
    const fitAddon = new FitAddon();
    if (this.terminal) {
      this.terminal.loadAddon(fitAddon);
      this.terminal.loadAddon(new CanvasAddon());
      const searchAddon = new SearchAddon();
      this.terminalSearch = searchAddon;
      this.terminal.loadAddon(searchAddon);
      this.terminal.open(commandRef);
      fitAddon.activate(this.terminal);
      fitAddon.fit();
    }
    await this.updateGraph();
    await this.gitFetch();
  },
  beforeUnmount() {
    clearInterval(this.interval || undefined);
    clearInterval(this.longInterval || undefined);
  },
  methods: {
    /** @param {KeyboardEvent | MouseEvent} ev */
    async nextSearch(ev) {
      if (ev.shiftKey) {
        return this.previousSearch();
      }
      if (this.terminalSearch) {
        this.terminalSearch.findNext(this.search);
      }
      return null;
    },
    async previousSearch() {
      if (this.terminalSearch) {
        this.terminalSearch.findPrevious(this.search);
      }
    },
    /** @param {string} line */
    openInVsCode(line) {
      const path = line.trim().split(' ').slice(1).join(' ');
      this.service.openLinkInVsCode(path);
    },
    async gitFetch() {
      try {
        if (!this.service.git) return;
        this.service.git.delta = null;
        await this.service.gitFetch()
          .catch((/** @type {*} */err) => notification.next('error', err?.response?.data || err?.message || err));
        const currentBranch = await this.service.getCurrentBranch();
        if (!currentBranch) return;
        this.service.git.delta = await this.service.gitRemoteDelta(currentBranch);
      } catch (error) {
        console.error(error);
        if (this.service.git) this.service.git.delta = 0;
      }
    },
    async addBranch() {
      const model = {
        name: '',
        shouldPush: false,
      };
      // @ts-ignore
      const res = await this.$refs['add-branch-modal'].open(model).promise;
      if (res) {
        if (!model.name) return notification.next('error', 'Branch name cannot be empty');
        await this.service.addBranch(model.name, model.shouldPush);
        if (model.shouldPush) await this.gitFetch();
      }
      return null;
    },

    async updateGraph() {
      const graph = await this.service.getGraph(this.graphOnAll)
        .catch((/** @type {*} */err) => notification.next('error', err?.response?.data || err?.message || err));
      if (graph && this.terminal) {
        this.terminal.clear();
        this.terminal.writeln(graph.join('\n'));
        setTimeout(() => {
          if (!this.terminal) return;
          this.terminal.scrollToTop();
        });
      }
    },
    /** @param {string} status */
    colorStatus(status) {
      status = status.trim();
      if (status.charAt(0) === 'D') {
        status = `<span style="color: #ff7f7f; font-weight: bold">D</span>${status.slice(1)}`;
      }
      if (status.charAt(0) === 'M') {
        status = `<span style="color: #ffe47f; font-weight: bold">M</span>${status.slice(1)}`;
      }
      if (status.charAt(0) === '?') {
        status = `<span style="color: #7fe1ff; font-weight: bold">??</span>${status.slice(2)}`;
      }
      return status;
    },
    /** @param {string} branchName */
    async changeBranch(branchName) {
      this.loader = true;
      try {
        branchName = branchName.trim();
        // @ts-ignore
        const res = await this.$refs['branch-modal'].open(branchName).promise;
        if (res) {
          await this.service.changeBranch(branchName)
            .then(() => notification.next('success', `Branch is now on ${branchName}`))
            .catch((/** @type {*} */err) => notification.next('error', err.response.data));
        }
        this.updateGraph();
      } catch (error) {

      } finally {
        this.loader = false;
        await this.service.updateGit();
        await this.gitFetch();
      }
    },
    /** @param {string} branchName */
    async deleteBranch(branchName) {
      this.loader = true;
      try {
        branchName = branchName.trim();
        // @ts-ignore
        const res = await this.$refs['branch-delete-modal'].open(branchName).promise;
        if (res) {
          await this.service.deleteBranch(branchName)
            .then(() => notification.next('success', `Branch ${branchName} is deleted`))
            .catch((/** @type {*} */err) => notification.next('error', err.response.data));
        }
        await this.service.updateGit();
        this.updateGraph();
      } catch (error) {

      } finally {
        this.loader = false;
        await this.service.updateGit();
        await this.gitFetch();
      }
    },
    /** @param {string} fileStatus */
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ');
      // @ts-ignore
      const res = await this.$refs['checkout-modal'].open(file).promise;
      if (res) {
        await this.service.checkoutFile(file)
          .then(() => notification.next('success', `Changes on ${file} are deleted`))
          .catch((/** @type {*} */err) => notification.next('error', err.response.data));
        await this.updateGraph();
      }
    },
    async reset() {
      // @ts-ignore
      const res = await this.$refs['reset-modal'].open().promise;
      if (res) {
        await this.service.reset()
          .then(() => notification.next('success', 'All changes are lost'))
          .catch((/** @type {*} */err) => notification.next('error', err.response.data));
        await this.updateGraph();
      }
    },
    async openReview() {
      const diff = await this.service.getDiff();
      const tokens = await Service.getTokens(diff);
      // @ts-ignore
      const res = await this.$refs['review-modal'].open(tokens).promise;
      if (res) {
        const review = await Service.reviewFromAi(diff);
        // @ts-ignore
        await this.$refs['review-result'].open(review).promise;
      }
    },
    async stash() {
      await this.service.stash()
        .then(() => notification.next('success', 'All changes is in stash'))
        .catch((/** @type {*} */err) => notification.next('error', err.response.data));
      return this.service.updateGit();
    },
    async stashPop() {
      await this.service.stashPop()
        .then(() => notification.next('success', 'All changes unstashed'))
        .catch((/** @type {*} */err) => notification.next('error', err.response.data));
      return this.service.updateGit();
    },
    async pull() {
      await this.service.pull()
        .then(() => notification.next('success', 'Branch is now up to date'))
        .catch((/** @type {*} */err) => notification.next('error', err.response.data));
      await this.service.updateGit();
      await this.updateGraph();
      await this.gitFetch();
    },
  },
};
</script>

<style lang="scss" scoped>
.git-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}
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
  width: 100%;
  flex-grow: 1;
  gap: 20px;
  z-index: 100;
  &>* {
    max-height: 400px;
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

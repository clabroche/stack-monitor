<template>
  <div class="stack-single" v-if="currentService" :key="$route.params.label">
    <div class="main">
      <div class="header">
        <div class="left">
          <div class="title">{{currentService.label}}</div>
          <div class="description">{{currentService.description}}</div>
        </div>
        <div class="right">
          <div class="icons">
            <a v-if="currentService.git && currentService.git.home" :href="currentService.git.home" target="_blank" title="Open git home"><i class="fab fa-github"  aria-hidden="true"></i></a>
            <a v-if="currentService.url" :href="currentService.url" target="_blank" title="Open service URL"><i class="fas fa-globe"  aria-hidden="true"></i></a>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-file-code"  aria-hidden="true" title="Open in Visual Studio Code" @click="openInVsCode()"></i>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-folder" aria-hidden="true" title="Open folder" @click="openFolder()"></i>
          </div>
        </div>
      </div>
      <div class="sections" v-if="currentService.enabled">
        <section-cmp header="System load by this service" :actions="[{label: 'Restart', click: () => restart(), icon: 'fas fa-sync'}, {label: 'Stop', click: () => stop(), icon: 'fas fa-stop'}]">
          <div class="systemInfos">
            <div class="progress-container">
              <label>Mem</label>
              <progress-cmp :percent="System.infos.cpu ? +System.infos.cpu.toFixed(2) : 0"></progress-cmp>
            </div>
            <div class="progress-container">
              <label>CPU</label>
              <progress-cmp :percent="System.infos.mem ? +System.infos.mem.toFixed(2) + '%' : 0"></progress-cmp>
            </div>
          </div>
        </section-cmp>

        <div class="git-section" v-if="currentService.git && currentService.git.remote">
          <section-cmp v-if="git.branches" :key="currentService.label" header="Branches">
            <ul class="branches">
              <li v-for="(branch, i) of git.branches" :key="'branch' +i" @click="changeBranch(branch)" :class="{active: branch.includes('*')}">
                {{branch.replace(/^\* /gm, '')}} <i class="fas fa-chevron-right"  aria-hidden="true"></i>
              </li>
            </ul>
          </section-cmp>
          <section-cmp v-if="git.status" header="Status" :actions="[{label: 'Reset', click: () => reset(), icon: 'fas fa-eraser'}]">
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

        <section-cmp header="Logs" :actions="[{label: 'Clear', icon: 'fas fa-trash', click: () => clear()}]">
          <logs v-if="currentService" :service="currentService" :key="currentService.label"></logs>
        </section-cmp>
      </div>
      <div v-else class="sections">
        <section-cmp header="This service is not started" :actions="[{label: 'Start', click: () => start(), icon: 'fas fa-play'}]">
        </section-cmp>
      </div>
    </div>
    <modal ref="reset-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Reset
      </div>
      <div slot="body">
        Do you really want to launch "git reset --hard" on this repository ?
      </div>
    </modal>
    <modal ref="checkout-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Checkout
      </div>
      <div slot="body" slot-scope="{data: file}">
        Do you really want to launch "git checkout {{file}}" on this repository ?
      </div>
    </modal>
    <modal ref="branch-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Branch change
      </div>
      <div slot="body" slot-scope="{data: branchName}">
        Do you really want to change branch to "{{branchName}}" on this repository ?
      </div>
    </modal>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import LogsVue from '../components/Logs.vue';
import ProgressVue from '../components/Progress.vue';
import SectionVue from '../components/Section.vue'
import ModalVue from '../components/Modal.vue';
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue,
    progressCmp: ProgressVue,
    sectionCmp: SectionVue,
    modal: ModalVue
  },
  data() {
    return {
      stack: [],
      git: {
        branches: [],
        status: [],
      },
      System,
      /** @type {import('../models/service').default}*/
      currentService: null,
      port:''
    }
  },
  watch: {
    async '$route.params.label'() {
      this.currentService = await Stack.getService(this.$route.params.label)
      if (this.currentService.git) {
        this.updateGit()
      }
    }
  },
  async mounted() {
    this.currentService = await Stack.getService(this.$route.params.label)
    this.interval = setInterval(async () => {
      await this.updateGit()
      await System.getInfos(this.currentService.label)
      await System.getGlobalInfos()
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    async updateGit() {
      this.git.branches = await this.currentService.getBranches(this.currentService.label)
      this.git.status = await this.currentService.getStatus(this.currentService.label)
    },
    async changeBranch(branchName) {
      branchName = branchName.trim()
      const res = await this.$refs['branch-modal'].open(branchName).promise
      if(res) {
        return this.currentService.changeBranch(branchName)
      }
    },
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ')
      const res = await this.$refs['checkout-modal'].open(file).promise
      if(res) {
        return this.currentService.checkoutFile(file)
      }
    },
    async reset() {
      const res = await this.$refs['reset-modal'].open().promise
      if(res) {
        return this.currentService.reset()
      }
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
    async openInVsCode() {
      this.currentService.openInVsCode()
    },
    async openFolder() {
      this.currentService.openFolder()
    },
    async restart() {
      await this.currentService.restart()
      Stack.services = [...Stack.services]
    },
    async stop() {
      await this.currentService.stop()
      Stack.services = [...Stack.services]
    },
    async start() {
      await this.currentService.start()
      Stack.services = [...Stack.services]
    },
    async clear() {
      this.currentService.clear()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.not-started {
  background-color: white;
}
.stack-single {
  display: flex;
  width: 100%;
  .main {
    height: calc(100vh);
    width: calc(100vw - 150px);
    margin: auto;
    overflow: auto;
    scroll-behavior: smooth;
    .header {
      width: 100%;
      height: 85px;
      display: flex;
      justify-content: space-between;
      padding: 10px calc(5% + 10px);
      font-weight: 700;
      position: relative;
      color: white;
      text-align: left;
      box-sizing: border-box;
      .left {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        .title {
          font-size: 2em;
        }
        .description {
          color: #97d8ff;
          font-weight: 500;
        }
      }
      .right {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        flex-shrink: 0;
        i {
          color: white;
          font-size: 1.4em;
          margin: 0 5px;
          transition: 300ms;
          cursor: pointer;
          &:hover {
            transform: scale(1.1);
          }
        }
      }
      &::before {
        content: '';
        z-index: -1;
        position: absolute;
        top: 0;
        left: 0;
        border-bottom: 3px solid #214f6b;
        border-radius: 4px;
        background-color: #0076bc;
        width: 100%;
        height: calc(100% + 75px);
      }
    }
    .sections {
      width: 90%;
      margin: auto;
    }
  }
}
.git-section {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: auto;
  max-height: 240px;
  overflow: hidden;
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


.progress-container {
  display: flex;
  align-items: center;
  label {
    width: 60px;
  }
}

</style>

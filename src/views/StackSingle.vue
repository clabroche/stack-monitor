<template>
  <div class="stack-single">
    <sidebar @navigate="currentService = $event" :currentService="currentService"></sidebar>
    <div class="main" v-if="currentService">
      <div class="header">{{currentService.label}}</div>
      <div class="sections">
        <section-cmp :actions="[{label: 'Open in VsCode', icon: 'fas fa-open', click: () => openInVsCode()}]" header="System load by this service">
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

        <div class="git-section">
          <section-cmp v-if="Git.branches.length" :key="currentService.label" header="Branches">
            <ul>
              <li v-for="(branch, i) of Git.branches" :key="'branch' +i">{{branch}}</li>
            </ul>
          </section-cmp>
          <section-cmp v-if="Git.status.length" header="Status">
            <ul>
              <li v-for="(status, i) of Git.status" :key="'status-' + i" v-html="colorStatus(status)">
              </li>
            </ul>
          </section-cmp>
        </div>

        <section-cmp header="Logs" :actions="[{label: 'Clear', icon: 'fas fa-trash', click: () => clear()}]">
          <logs v-if="currentService" :service="currentService" :key="currentService.label"></logs>
        </section-cmp>
      </div>
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import Git from '../models/git'
import Socket from '../helpers/socket'
import LogsVue from '../components/Logs.vue';
import ProgressVue from '../components/Progress.vue';
import sidebarVue from '../components/sidebar.vue';
import SectionVue from '../components/Section.vue'
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue,
    progressCmp: ProgressVue,
    sidebar: sidebarVue,
    sectionCmp: SectionVue
  },
  data() {
    return {
      Stack,
      Git,
      System,
      currentService: null,
      port:''
    }
  },
  watch: {
    async currentService() {
      if(!this.currentService) return 
      await Git.getBranches(this.currentService.label)
      await Git.getStatus(this.currentService.label)
    }
  },
  async mounted() {
    await Stack.getCurrentStack()
    if(!this.currentService) this.currentService = Stack.stack[0]
    Socket.on('port:update', data => {
      if(data.label !== this.service.label) return 
      this.currentService.port = data.msg
    })
    this.interval = setInterval(async () => {
      await Git.getBranches(this.currentService.label)
      await Git.getStatus(this.currentService.label)
      await System.getInfos(this.currentService.label)
      await System.getGlobalInfos()
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
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
    openInVsCode() {
      Stack.openInVsCode(this.currentService.label)
    },
    restart() {
      Stack.restart(this.currentService.label)
    },
    clear() {
      Stack.clear(this.currentService.label)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.stack-single {
  display: flex;
  width: 100%;
  .main {
    height: calc(100vh);
    width: 90%;
    margin: auto;
    overflow: auto;
    scroll-behavior: smooth;
    .header {
      font-size: 2em;
      width: 100%;
      text-align: center;
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 calc(5% + 10px);
      font-weight: 700;
      position: relative;
      color: white;
      box-sizing: border-box;
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
}


.progress-container {
  display: flex;
  align-items: center;
  label {
    width: 60px;
  }
}

</style>

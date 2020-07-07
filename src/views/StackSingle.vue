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
            <a v-if="currentService.git && currentService.git.home" :href="currentService.git.home" target="_blank" title="Open git home"><i class="fab fa-github"></i></a>
            <a v-if="currentService.url" :href="currentService.url" target="_blank" title="Open service URL"><i class="fas fa-globe"></i></a>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-file-code" title="Open in Visual Studio Code" @click="openInVsCode()"></i>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-folder" title="Open folder" @click="openFolder()"></i>
          </div>
        </div>
      </div>
      <div class="sections">
        <section-cmp header="System load by this service">
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
          <section-cmp v-if="git.branches.length" :key="currentService.label" header="Branches">
            <ul class="branches">
              <li v-for="(branch, i) of git.branches" :key="'branch' +i">{{branch}} <i class="fas fa-chevron-right"></i></li>
            </ul>
          </section-cmp>
          <section-cmp v-if="git.status.length" header="Status">
            <ul>
              <li v-for="(status, i) of git.status" :key="'status-' + i" v-html="colorStatus(status)">
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
import LogsVue from '../components/Logs.vue';
import ProgressVue from '../components/Progress.vue';
import SectionVue from '../components/Section.vue'
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue,
    progressCmp: ProgressVue,
    sectionCmp: SectionVue
  },
  data() {
    return {
      stack: [],
      git: {
        branches: [],
        status: [],
      },
      System,
      /** @type {import('../models/stack').default}*/
      currentService: null,
      port:''
    }
  },
  watch: {
    async '$route.params.label'() {
      this.currentService = new Stack({label: this.$route.params.label})
      await this.currentService.fetch()
      if (this.currentService.git) {
        this.updateGit()
      }
    }
  },
  async mounted() {
    this.currentService = new Stack({label: this.$route.params.label})
    await this.currentService.fetch()
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
    openFolder() {
      Stack.openFolder(this.currentService.label)
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
    width: calc(100vw - 150px);
    margin: auto;
    overflow: auto;
    scroll-behavior: smooth;
    .header {
      width: 100%;
      height: 85px;
      text-align: center;
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
  ul {
    margin: 0;
    padding: 0;
    &.branches {
      li {
        transition: 300ms;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
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
    li {
      padding: 0;
      list-style: none;
      margin: 0;
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

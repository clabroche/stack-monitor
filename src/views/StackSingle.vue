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

        <git :currentService="currentService"/>

        <logs v-if="currentService" :service="currentService" :key="currentService.label"></logs>
      </div>
      <div v-else class="sections">
        <section-cmp header="This service is not started" :actions="[{label: 'Start', click: () => start(), icon: 'fas fa-play'}]">
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
import GitVue from '../components/Git.vue';
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue,
    progressCmp: ProgressVue,
    sectionCmp: SectionVue,
    git: GitVue
  },
  data() {
    return {
      stack: [],
      System,
      /** @type {import('../models/service').default}*/
      currentService: null,
      port:''
    }
  },
  watch: {
    async '$route.params.label'() {
      this.currentService = await Stack.getService(this.$route.params.label)
    }
  },
  async mounted() {
    this.currentService = await Stack.getService(this.$route.params.label)
    this.interval = setInterval(async () => {
      await System.getInfos(this.currentService.label)
      await System.getGlobalInfos()
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
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



.progress-container {
  display: flex;
  align-items: center;
  label {
    width: 60px;
  }
}

</style>

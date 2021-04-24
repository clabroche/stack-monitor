<template>
  <div class="stack-single" v-if="currentService" :key="$route.params.label">
    <div class="main">
      <div class="header">
        <div class="left">
          <div class="title">{{currentService.label}}</div>
          <div class="description">{{currentService.description}}</div>
        </div>
        <div class="right">
          <notification-bell/>
          <div class="icons">
            <a v-if="currentService.git && currentService.git.home" :href="currentService.git.home" target="_blank" title="Open git home"><i class="fab fa-github"  aria-hidden="true"></i></a>
            <a v-if="currentService.url" :href="currentService.url" target="_blank" title="Open service URL"><i class="fas fa-globe"  aria-hidden="true"></i></a>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-file-code"  aria-hidden="true" title="Open in Visual Studio Code" @click="openInVsCode()"></i>
            <i v-if="currentService.spawnOptions && currentService.spawnOptions.cwd" class="fas fa-folder" aria-hidden="true" title="Open folder" @click="openFolder()"></i>
          </div>
        </div>
      </div>
      <div class="sections" v-if="currentService.enabled">
        <div class="system-cards">
          <card class="card">
            <h2>Memory</h2>
            <progress-cmp :percent="mem"></progress-cmp>
          </card>
          <card class="card purple">
            <h2>CPU</h2>
            <progress-cmp :percent="cpu"></progress-cmp>
          </card>
          <card class="card orange">
            <button @click="restart()"><i class="fas fa-sync" aria-hidden="true"></i> Restart</button>
            <button @click="stop()"><i class="fas fa-stop" aria-hidden="true"></i> Stop</button>
          </card>
        </div>
        <tabs class="tabs" :tabs="[
          {label: 'Git', id: 'git', icon:'fab fa-git-alt'},
          {label: 'Npm', id: 'npm', icon: 'fab fa-npm'},
          {label: 'Logs', id: 'logs', icon: 'fas fa-terminal'},
          {label: 'Bugs', id: 'bugs', icon: 'fas fa-bug'}
        ]" 
          :showLabels="false">
          <template #default="{tab}">
            <div v-if="tab.id === 'git'" class="tab">
              <git :currentService="currentService" :key="currentService.label"/>
            </div>
            <div v-else-if="tab.id === 'npm'" class="tab">
              <npm :currentService="currentService" :key="currentService.label"/>
            </div>
            <div v-else-if="tab.id === 'logs'" class="tab">
              <logs :service="currentService" :key="currentService.label"></logs>
            </div>
            <div v-else-if="tab.id === 'bugs'" class="tab">
              <bugs :service="currentService" :key="currentService.label"></bugs>
            </div>
          </template>
        </tabs>
      </div>
      <div v-else class="sections">
        <section-cmp header="This service is not started" :actions="[{label: 'Start', click: () => start(), icon: 'fas fa-play'}]" class="section-not-started">
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
import GitVue from '../components/Git.vue';
import NpmVue from '../components/Npm.vue';
import SectionVue from '../components/Section.vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import router from '../router/router'
import Tabs from '../components/Tabs.vue';
import Card from '../components/Card.vue';
import NotificationBell from '../components/NotificationBell.vue';
import BugsVue from '../components/Bugs.vue';
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue,
    progressCmp: ProgressVue,
    git: GitVue,
    npm: NpmVue,
    bugs: BugsVue,
    sectionCmp: SectionVue,
    Tabs,
    Card,
    NotificationBell
  },
  setup() {
    /** @type {import('vue').Ref<import('../models/service').default[]>} */
    const stack = ref([])
      /** @type {import('vue').Ref<import('../models/service').default>}*/
    const currentService = ref()
    const cpu = ref(0)
    const mem = ref(0)
    watch(() => router.currentRoute.value.params.label, async () => {
      currentService.value = await Stack.getService(router.currentRoute.value.params.label)
    })
    let interval
    onMounted(async () => {
      currentService.value = await Stack.getService(router.currentRoute.value.params.label)
      interval = setInterval(async () => {
        const {cpu: _cpu, mem: _mem} = await System.getInfos(currentService.value .label)
        cpu.value = _cpu
        mem.value = _mem
      }, 1000);
    })
    onBeforeUnmount(()=> {
      clearInterval(interval)
    })

    return {
      stack,
      System,
      currentService,
      cpu, mem,
      async openInVsCode() {
        currentService.value .openInVsCode()
      },
      async openFolder() {
        currentService.value .openFolder()
      },
      async restart() {
        await currentService.value .restart()
        Stack.services = [...Stack.services]
      },
      async stop() {
        await currentService.value .stop()
        Stack.services = [...Stack.services]
      },
      async start() {
        await currentService.value .start()
        Stack.services = [...Stack.services]
      },
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.section-not-started {
  box-shadow: 10px 10px 20px rgba(0,0,0,0.1);
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
        flex-direction: column;
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
        background: linear-gradient(93deg, #1d95db 0%, #074971 100%);
        width: 100%;
        height: calc(100% + 30px);
      }
    }
    .sections {
      width: 90%;
      margin: auto;
    }
  }
}

.system-cards{
  display: flex;
  justify-content: center;
  .card {
    margin-right: 10px;
    button {
      background: #0000003d;
      width: 100%;
      box-shadow: 4px 4px 8px rgba(0,0,0,0.3),
        -4px -4px 8px rgba(255,255,255,0.2);
      &:hover {
        box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
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
.tabs {
  margin-top: 20px;
  .tab {
    transform: translateZ(0);
  }
}

</style>

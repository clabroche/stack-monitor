<template>
  <div class="stack-single" v-if="currentService" :key="$route.params.label.toString()">
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
            <a v-for="url in currentService.urls" :key="url" :href="url" target="_blank" :title="url"><i class="fas fa-globe"  aria-hidden="true"></i></a>
            <img v-if="currentService.rootPath" src="@/assets/vscode-icon.png" alt="vscode icon"  aria-hidden="true" title="Open in Visual Studio Code" @click="openInVsCode()"/>
            <i v-if="currentService.rootPath" class="fas fa-folder" aria-hidden="true" title="Open folder" @click="openFolder()"></i>
          </div>
        </div>
      </div>
      <div class="sections" >
        <div v-if="!currentService.enabled" class="sections">
          <section-cmp header="This service is not started" :actions="[{ label: 'Start', click: () => start(), icon: 'fas fa-play' }]" class="section-not-started">
          </section-cmp>
        </div>
        <div v-else class="system-cards">
          <card class="card to-hide-for-small-screen" :mini="true">
            <i class="fas fa-memory"></i>
            <div class="hovered">Memory</div>
            <progress-cmp :percent="mem"></progress-cmp>
          </card>
          <card class="card to-hide-for-small-screen" color="purple" :mini="true">
            <i class="fas fa-microchip"></i>
            <div class="hovered">CPU</div>
            <progress-cmp :percent="cpu"></progress-cmp>
          </card>
          <card class="card restart-stop-card" color="orange" :mini="true">
            <button class="small" @click="restart()" :disabled="restartInProgress">
              <i class="fas fa-sync" aria-hidden="true" :class="{rotate: restartInProgress}"></i>
              <span>Restart</span>
            </button>
            <button class="small" @click="stop()">
              <i class="fas fa-stop" aria-hidden="true"></i>
              <span>Stop</span>
            </button>
          </card>
        </div>
        <tabs class="tabs" :tabs="tabs" :showLabels="false" direction="left" :contentCss="{height: '100%'}">
          <template #default="{tab}">
            <div class="tab">
              <component :is="tab.id" :service="currentService" :key="currentService.label"></component>
            </div>
          </template>
        </tabs>
      </div>
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import ProgressVue from '../components/Progress.vue';
import SectionVue from '../components/Section.vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Tabs from '../components/Tabs.vue';
import Card from '../components/Card.vue';
import NotificationBell from '../components/NotificationBell.vue';
import axios from '../helpers/axios'
import Socket from '../helpers/Socket';
import { useRouter } from 'vue-router';

export default {
  name: 'StackSingle',
  components: {
    progressCmp: ProgressVue,
    sectionCmp: SectionVue,
    Tabs,
    Card,
    NotificationBell,
  },
  setup() {
    const router = useRouter(); 
    /** @type {import('vue').Ref<import('../models/service').default[]>} */
    const stack = ref([])
      /** @type {import('vue').Ref<import('../models/service').default | undefined>}*/
    const currentService = ref()
    const cpu = ref(0)
    const mem = ref(0)
    const restartInProgress = ref(false)
    watch(() => router.currentRoute.value.params.label, async () => {
      await reload()
    })
    Socket.socket.on('conf:update', (/**@type {string[]}*/data) => {
      if (data.includes(router.currentRoute.value.params.label.toString())) {
        reload()
      }
    })

    /** @type {number} */
    let interval
    const tabs = ref([])

    async function reload() {
      currentService.value = await Stack.getService(router.currentRoute.value.params.label.toString())
      if(currentService.value) {
        const {data: plugins} = await axios.get('/plugins/services/' + currentService.value.label)
        tabs.value = plugins
          .sort((
            /** @type {any} */ a,
            /** @type {any} */ b
          ) => a.order - b.order)
          .map((/** @type {{ name: any; icon: any; hidden: any; }} */ plugin) => {
            const tab = {
              label: plugin.name,
              id: plugin.name,
              icon:plugin.icon,
              hidden: plugin.hidden,
              warning: 0
            }
            if(plugin.name === "Configuration") {
              const overrideEnvs = Object.keys(currentService.value?.spawnOptions?.overrideEnvs || {})
              const envs = Object.keys(currentService.value?.spawnOptions?.env || {})
              if(envs.some((key => overrideEnvs.includes(key)))) {
                tab.warning = 1   
              }
            }
            return tab
          })
      }
    }

    onMounted(async () => {
      await reload()
      // @ts-ignore
      interval = setInterval(async () => {
        if(!currentService.value?.label) return
        const {cpu: _cpu, mem: _mem} = await System.getInfos(currentService.value.label.toString())
        cpu.value = _cpu
        mem.value = _mem
      }, 1000);
    })
    onBeforeUnmount(()=> {
      if(interval) clearInterval(interval)
    })
    return {
      stack,
      System,
      currentService,
      cpu, mem,
      tabs,
      restartInProgress,
      async openInVsCode() {
        currentService.value?.openInVsCode()
      },
      async openFolder() {
        currentService.value?.openFolder()
      },
      async restart() {
        restartInProgress.value = true
        await currentService.value?.restart()
          .finally(() => restartInProgress.value = false)
      },
      async stop() {
        await currentService.value?.stop()
      },
      async start() {
        await currentService.value?.start()
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
  overflow: hidden;
  .main {
    flex-grow: 1;
    height: 100%;
    margin: auto;
    overflow: auto;
    scroll-behavior: smooth;
    margin-bottom: 20px;
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
        img {
          width: 18px;
          filter: contrast(0) brightness(2);
        }
        i {
          color: white;
          font-size: 1.4em;
        }
        i,img {
          cursor: pointer;
          transition: 300ms;
          margin: 0 5px;
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
        border-bottom-left-radius: 20px;
        border-bottom-right-radius: 20px;
        background: linear-gradient(93deg, #1d95db 0%, #074971 100%);
        width: 100%;
        height: calc(100% + 30px);
      }
    }
    .sections {
      margin: auto;
      overflow: auto;
      padding: 0 20px;
      box-sizing: border-box;
    }
  }
}

.system-cards{
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  @media (max-width: 1300px) {
    .to-hide-for-small-screen {
      display: none;
    }
  }
  .card {
    i {
      font-size: 20px;
      padding: 0 10px;
      box-sizing: border-box;
    }
    &:hover {
      .hovered {
        max-width: 100px;
      }
    }
    button {
      box-shadow: none;
    }
    .hovered {
      position: absolute;
      top: 0;
      left: 0;
      transition: 300ms;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(10px) brightness(0.5);
      z-index: 1;
      font-weight: bold;
      max-width: 0;
      overflow: hidden;

    }
  }
  .restart-stop-card {
    button {
      border-radius: 1000px;
      background: #0000003d;
      width: 100%;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      &:hover {
        span {
          visibility: visible;
          max-width: 100px;
        
        }
      }
      span {
        visibility: hidden;
        max-width: 0;
        overflow: hidden;
        transition: 300ms;
      }
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
    padding-left: 20px;
    box-sizing: border-box;
    transform: translateZ(0);
    height: 100%;
  }
}

.rotate {
  animation: rotation 2s infinite;
}
@keyframes rotation {
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(360deg);
  }
}
</style>

<template>
  <div id="app-container" v-if="connected">
    <div id="app">
      <sidebar-view-mode v-if="!['stack-chooser', 'import-create'].includes($route.name?.toString() || '')"/>
      <sidebar v-if="['stack-single', 'stack-single-no-view'].includes($route.name?.toString() || '')"/>
      <div class="main">
        <router-view/>
      </div>
    </div>
    <EnvironmentsChooser/>
  </div>
  <div class="not-connected" v-else>
    Server is not connected or has crashed <br>
    Try to restart it or fill an issue: <br><br>
    <a :href="githubIssue" target="_blank">Click here</a>
  </div>

  <template v-for="cmp of componentsToLoad">
    <component :is="cmp"></component>
  </template>
  <Finder/>
  <notif-history/>
  <notifications/>

</template>

<script>
import Stack from './models/stack'
import sidebarVue from './components/sidebar.vue'
import Socket from './helpers/Socket'
import githubIssue from './helpers/githubIssue'
import { ref, onMounted } from 'vue'
import system from './models/system'
import notif from './helpers/notification'
import Notifications from "./components/Notifications.vue"
import './helpers/ServiceError'
import NotifHistory from './components/NotifHistory.vue'
import SidebarViewMode from './components/SidebarViewMode.vue'
import EnvironmentsChooser from './components/EnvironmentsChooser.vue'
import { useRouter } from 'vue-router';
import Theme from './helpers/Theme'
import plugins from '@clabroche/modules-plugins-loader-front/src/views';

const componentsToLoad = plugins.filter(p => p.load).reduce((agg, {cmp, name}) => {
  agg[name] = cmp
  return agg
}, {})
export default {
  components: {
    sidebar: sidebarVue,
    Notifications,
    NotifHistory,
    SidebarViewMode,
    EnvironmentsChooser,
    ...componentsToLoad
  },
  setup() {
    (async () => {
      const additionalThemes = await Stack.getAdditionalThemes()
        .catch(err => {
          console.error(err)
          return {}
        })
      Theme.load(additionalThemes)
    })()
    const router = useRouter(); 
    const connected = ref(true)
    const redirect = async () => {
      connected.value = Socket.socket.connected
      if(!connected.value) Stack.services.value = []
      if(
        router.currentRoute.value.fullPath.startsWith('/stack-single') ||
        router.currentRoute.value.fullPath.startsWith('/stack-multiple')
      ) {
        router.push({name:'stack-chooser'})
      }
      const shouldSetup = await Stack.shouldSetup()
      if(shouldSetup) router.push({name: 'settings', params: {setting: 'crypto'}, query: { wrongKey: 'true' }})
    }
    onMounted(async ()=> {
      Socket.on('connect',  redirect);
      Socket.on('disconnect', redirect);
      Socket.on('forceReload', () => {
        window.location.reload()
      });
      Socket.on('system:wrongKey', () => router.push({name: 'settings', params: {setting: 'crypto'}, query: { wrongKey: 'true' }}))
      await redirect()
    })

    // Check versions
    /** @type {import('vue').Ref<{local: string,remote: string,hasUpdate: boolean} | null>} */
    let versions = ref({ local: '', remote: '', hasUpdate: false })
    onMounted(async () => {
      versions.value = await system.hasUpdate()
      if (versions.value?.hasUpdate) {
        notif.next('error', `Update available: ${versions.value.local} => ${versions.value.remote}`)
      }
    })
    return {
      componentsToLoad: ref(Object.keys(componentsToLoad)),
      redirect,
      connected,
      githubIssue,
      versions,
    }
  }
}
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/all.min.css';
@import './assets/fonts/Jost/Jost.css';
@import './assets/theme/index.scss'
</style>

<style lang="scss" scoped> 
.main {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-height: 100%;
}
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;

  #app {
    width: 100vw;
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.not-connected {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  text-align: center;
}
</style>
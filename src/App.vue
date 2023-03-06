<template>
  <div id="app" v-if="connected">
    <sidebar-view-mode v-if="['stack-single','stack-multiple'].includes($route.name)"/>
    <sidebar v-if="$route.name === 'stack-single'"/>
    <router-view/>
  </div>
  <div class="not-connected" v-else>
    Server is not connected or has crashed <br>
    Try to restart it or fill an issue: <br><br>
    <a :href="githubIssue" target="_blank">Click here</a>
  </div>
  <notif-history/>
  <notifications/>
</template>

<script>
import Stack from './models/stack'
import sidebarVue from './components/sidebar.vue'
import socket from './helpers/socket'
import githubIssue from './helpers/githubIssue'
import { ref, onMounted } from 'vue'
import router from './router/router'
import system from './models/system'
import notif from './helpers/notification'
import Notifications from "./components/Notifications.vue"
import './helpers/ServiceError'
import NotifHistory from './components/NotifHistory.vue'
import SidebarViewMode from './components/SidebarViewMode.vue'
export default {
  components: {
    sidebar: sidebarVue,
    Notifications,
    NotifHistory,
    SidebarViewMode
  },
  setup() {
    const connected = ref(false)
    const redirect = async () => {
      connected.value = socket.connected

      if(!connected.value) Stack.services = []
      const enabledServices = await Stack.getEnabledServices()
      if(connected.value && !Stack.services.length) {
        router.push({name:'import-create'})
      } else if(!enabledServices.length && router.currentRoute.value.name !== 'stack-chooser') {
        router.push({name:'stack-chooser'})
      }
    }
    onMounted(()=> {
      redirect()
      socket.on('connect',  redirect);
      socket.on('disconnect', redirect);
    })

    // Check versions
    let versions = ref({ local: null, remote: null, hasUpdate: null })
    onMounted(async () => {
      versions.value = await system.hasUpdate()
      versions.value.hasUpdate
        ? notif.next('error', `Update available: ${versions.value.local} => ${versions.value.remote}`)
        : notif.next('success', 'Stack monitor is up to date')
    })
    return {
      redirect,
      connected,
      githubIssue,
      versions
    }
  }
}
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/all.min.css';
@import './assets/fonts/Jost/Jost.css';
/* width */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #e1e1e1;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #aaa;
  border-radius: 5px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #666;
}
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  background-color: #eee;
  color: #4c4c4c;
  font-size: 0.9em;
  font-family: JOST, sans-serif;
  #app {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
button {
  padding: 10px;
  margin: 3px;
  border-radius: 4px;
  $gradient: 50deg, #1d95db 0%, #074971 100%;
  background: -webkit-linear-gradient($gradient);
  background: linear-gradient($gradient);
  color: white;
  font-weight: bold;
  border:none;
  transition: 300ms;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow:
    -5px 5px 10px #bdbdbd,
    5px -5px 10px #ffffff;
  &:hover {
    background-color: #194f91;
    box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
  }
  &.bordered {
    border: 1px solid #074971;
    color: #074971;
    background: none;
  }
  &.small {
    padding: 5px;
    font-size: 0.7em;
    width: 80px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    i {
      margin-right: 5px;
    }
    .text {
      flex-grow: 1;
      text-align: center;
    }
  }
}

button.success {
  background-color: #41d143;
  &:hover {
    background-color: #258d27;
  }
}

</style>

<style lang="scss" scoped> 
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

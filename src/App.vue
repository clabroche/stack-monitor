<template>
  <div id="app" v-if="connected">
    <sidebar v-if="$route.name === 'stack-single'"/>
    <router-view/>
  </div>
  <div class="not-connected" v-else>
    Server is not connected or has crashed <br>
    Try to restart it or fill an issue: <br><br>
    <a :href="githubIssue" target="_blank">Click here</a>
  </div>
</template>

<script>
import Stack from './models/stack'
import sidebarVue from './components/sidebar.vue'
import socket from './helpers/socket'
import githubIssue from './helpers/githubIssue'
import { ref, onMounted } from 'vue'
import router from './router/router'
export default {
  components: {
    sidebar: sidebarVue
  },
  setup() {
    const connected = ref(false)
    const redirect = async () => {
      connected.value = socket.connected
      if(!connected.value) Stack.services = []
      const enabledServices = await Stack.getEnabledServices()
      if(!enabledServices.length && router.currentRoute.value.name !== 'stack-chooser') {
        router.push({name:'stack-chooser'})
      }
    }
    onMounted(()=> {
      redirect()
      socket.on('connect',  redirect);
      socket.on('disconnect', redirect);
    })
    return {
      redirect,
      connected,
      githubIssue
    }
  }
}
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/all.min.css';
@import './assets/fonts/Jost/Jost.css';
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f4f4f4;
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
  &:hover {
    background-color: #194f91;
    transform: scale(1.01);
    box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
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

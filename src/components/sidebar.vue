<template>
  <div class="sidebar">
    <ul>
      <input type="text" v-model="search" placeholder="Search service..." @keypress.enter="launchService" >
      <template v-if="sortedStack.length">
        <sidebar-item v-for="service of sortedStack" :key="service.label" :service="service"/>
      </template>
    </ul>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import { sort } from 'fast-sort'
import sidebarItemVue from './sidebarItem.vue'
import { computed, onMounted, ref } from 'vue'
import Socket from '@/helpers/Socket'
import notification from '@/helpers/notification'
import router from '@/router/router'

export default {
  components: {
    sidebarItem: sidebarItemVue
  },
  props: {
    currentService: {default: null}
  },
  setup() {
    const search = ref('')

    onMounted(async () => {
      await Stack.loadServices()
      Socket.socket.on('service:crash', async ({label, code, signal}) => {
        notification.next('error', `${label} has crashed with code ${code}`)
        await Stack.loadServices()
      });
    })
    const sortedStack = computed(() => sort(Stack.services.value.filter(a => (a.label || '').toUpperCase().includes(search.value.toUpperCase()))).desc((a) => a.enabled))
    return {
      search,
      sortedStack,
      System,
      /** @param {KeyboardEvent} $event */
      launchService($event) {
        const service = sortedStack.value[0]
        if ($event.ctrlKey && service) {
          service?.restart()
          router.push({name: 'stack-single', params: {label: service.label}})
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
input {
  width: 90%;
  box-sizing: border-box;
  margin: 5px auto;
  justify-self: center;
}
.sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0px 0px 4px 0px black;
    width: 150px;
    background-color: white;
    height: 100%;
    flex-shrink: 0;
    z-index: 3;
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
    }
  }


.progress-container {
  display: flex;
  align-items: center;
  label {
    width: 60px;
  }
}

.system-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  &>button {
    z-index: 1;
    width: 90%;
    margin: auto;
  }
} 
.system .title {
  justify-content: center;
}

</style>
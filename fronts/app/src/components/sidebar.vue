<template>
  <div class="sidebar-root" :class="{ minimized, mouseInAnchor }" @mouseenter="mouseInAnchor = true" @mouseleave="mouseInAnchor = false">
    <div class="sidebar">
      <ul>
        <div class="header">
          <input type="text" v-model="search" @input="openGroup = 'All'" placeholder="Search service..." @keypress.enter="launchService" >
          <i class="fas fa-chevron-left" @click="minimized = true"></i>
        </div>
        <div class="add-container">
          <div class="add">
            <i class="fas fa-plus"></i>
            <input v-model="serviceLabelToAdd" placeholder="Add new service..." @keypress.enter="addService">
          </div>
          <label v-if="addServiceError">{{ addServiceError }}</label>
        </div>
        <sidebar-group header="All" :open="openGroup === 'All'" @open="openGroup = 'All'">
          <sidebar-item v-for="service of sortedStack" :key="service.label" :service="service"/>
        </sidebar-group>
        <sidebar-group :header="group.label" v-for="(group) of groups" :open="openGroup === group.label" @open="openGroup = group.label" @close="openGroup = 'All'">
          <sidebar-item v-for="service of group.services" :key="service.label" :service="service"/>
        </sidebar-group>
      </ul>
    </div>
    <div class="minimized anchor" @click="minimized = false" >
      <i class="fas fa-thumbtack" v-if="mouseInAnchor"></i>
      <i class="fas fa-chevron-right" v-else></i>
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import { sort } from 'fast-sort'
import sidebarItemVue from './sidebarItem.vue'
import sidebarGroup from './sidebarGroup.vue'
import { computed, onMounted, ref } from 'vue'
import Socket from '../helpers/Socket'
import notification from '../helpers/notification'
import { useRouter } from 'vue-router';
import axios from '../helpers/axios'

export default {
  components: {
    sidebarItem: sidebarItemVue,
    sidebarGroup
  },
  props: {
    currentService: {default: null}
  },
  setup() {
    const router = useRouter(); 
    const search = ref('')
    const openGroup = ref('All');
    const minimized = ref(false);
    const mouseInAnchor = ref(false);
    onMounted(async () => {
      await Stack.loadServices()
      Socket.on('service:crash', async ({ label, code, signal }) => {
        notification.next('error', `${label} has crashed with code ${code}`)
        await Stack.loadServices()
      });

      Socket.on('service:exit', async ({ label, code, signal }) => {
        await Stack.loadServices()
      });
      Socket.on('service:healthcheck:down', async ({label, code, signal}) => {
        const service = await Stack.getService(label)
        if(!service?.crashed) await Stack.loadServices()
      });
      Socket.on('service:healthcheck:up', async ({label, code, signal}) => {
        const service = await Stack.getService(label)
        if(service?.crashed) await Stack.loadServices()
      });
    })
    const sortedStack = computed(() => sort(Stack.services.value.filter(a => (a.label || '').toUpperCase().includes(search.value.toUpperCase()))).desc((a) => a.enabled))

    const groups = computed(() => {
      const groupObject = sortedStack.value.reduce((agg, service) => {
        if (service.groups?.length) {
          service.groups.forEach((group) => {
            if (!agg[group]) agg[group] = []
            agg[group].push(service)
          })
        }
        return agg
      }, {})
      return Object.keys(groupObject)
        .map(key => ({label: key, services: groupObject[key]}))
        .sort((a,b) => a.label.localeCompare(b.label))
    })
    const serviceLabelToAdd= ref('')
    return {
      groups,
      minimized,
      mouseInAnchor,
      openGroup,
      search,
      sortedStack,
      System,
      serviceLabelToAdd,
      addServiceError: computed(() => {
        if(Stack.services.value.find(a => a.label === serviceLabelToAdd.value)) return 'A service already exists with this label'
        return ''
      }),
      addService: () => {
        if(Stack.services.value.find(a => a.label === serviceLabelToAdd.value)) return
        axios.post('/stack/services',  {
          label: serviceLabelToAdd.value,
        }).then(() => {
          const label = serviceLabelToAdd.value
          setTimeout(() => {
            router.push({name: 'stack-single', params: {label}, query: {tab: "Configuration"}})
          }, 100);
          serviceLabelToAdd.value = ''
        })
      },
      /** @param {KeyboardEvent} $event */
      launchService($event) {
        const service = sortedStack.value[0]
        if ($event.ctrlKey && service) {
          service?.restart()
          localStorage.setItem('last-service-visisted', service.label || '')
          router.push({name: 'stack-single', params: {label: service.label}})
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>

@mixin card($mainColor, $secondaryColor, $shadow) {
  background: $mainColor;
  background: linear-gradient(93deg, $mainColor 0%, $secondaryColor 100%);
  color: white;
  box-shadow:
    0 0 5px 0 $shadow;
  &::before, &::after {
    box-shadow:
      inset 0 0 50px $mainColor,
      inset -20px 0 300px $mainColor,
      0 0 50px #fff,
      -10px 0 80px $mainColor,
      10px 0 80px $mainColor;
  }
}
.sidebar-root {
  height: 100vh;
  display: flex;

  &.minimized {
    .sidebar {
      max-width: 0;
      overflow: hidden;
      opacity: 0;

    }
    .anchor {
      max-width: 25px;
    }
    &.mouseInAnchor {
      .sidebar {
        max-width: 250px;
        overflow: hidden;
        opacity: 1;
      }
      .anchor {
        max-width: 50px;
        width: 50px;
      }
    }
  }
  .anchor  {
    transition: 300ms;
    max-width: 0;
    overflow: hidden;
    display: flex;
    width: 25px;
    justify-content: center;
    align-items: center;
    @include card(rgb(57, 42, 59), rgb(156, 22, 209), rgb(141, 58, 148));
    &:hover {
      @include card(rgb(81, 56, 84), rgb(156, 22, 209), rgb(141, 58, 148));
    }
    color: white;
    cursor: pointer;
    &:hover {
      background-color: #666;
    }
    i {
      width: 100%;
      font-size: 25px;
      text-align: center;
    }
  }
}
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  i {
    width: 15px;
    height: 15px;
  }
}
input {
  flex-grow: 1;
  box-sizing: border-box;
  margin: 5px auto;
  justify-self: center;
}
.sidebar {
    transform-origin: left;
    transform: scaleX(1);
    opacity: 1;
    transition: 300ms;
    display: flex;
    overflow: auto;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0px 0px 4px 0px black;
    width: 250px;
    max-width: 250px;
    background-color: var(--system--secondary-sidebar-backgroundColor);
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
.add-container {
  margin: 0 10px;
  margin-bottom: 10px;
  label {
    color: red;
  }
  .add {
    display: flex;
    align-items: center;
    gap: 10px;
    input {
      margin: 0;
    }
  }
}
</style>
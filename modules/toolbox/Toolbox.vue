<template>
  <div class="toolbox">
    <div class="sidebar">
      <ul>
        <input type="text" placeholder="Search tool..." v-model="searchToolTerm">
        <li v-for="plugin of buttonsPlugins" :key="plugin.name" class="sidebar-item"
          @click="plugin?.click?.()"
          :class="{ active: isActive(plugin) }">
          <div>
            <i :class="plugin.icon"></i>
            {{ plugin.text }}
          </div>
        </li>
      </ul>
    </div>
    <div class="container">
      <router-view v-if="$router.currentRoute.value.fullPath !== '/toolbox'"/>
      <div v-else class="no-tools">
        <div>
          <i class="fas fa-toolbox"></i>
        </div>
        <div>
          Choisissez un outils
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from '@/helpers/axios'
import router from '@/router/router'

import { onMounted, ref, computed } from 'vue'
const plugins = ref([])
const searchToolTerm = ref('')
onMounted(async () => {
  const { data: _plugins } = await axios.get('/plugins/toolbox')
  plugins.value = _plugins?.flat() || []
})

const buttonsPlugins = computed(() => ([
  ...plugins.value.map(plugin => {
    return plugin.placements.map(placement => {
      return {
        ...plugin,
        text: placement.label,
        icon: placement.icon,
        click: placement?.goTo ? () => {
          router.push({
            ...placement?.goTo || {},
            path: `/toolbox${(placement.goTo?.path || placement.goTo)}`
          })
        } : () => { },
        active: placement?.active
      }
    })
  }).flat().filter(f => f && f.text?.toUpperCase().includes(searchToolTerm?.value?.toUpperCase())),
]))

function isActive(plugin) {
  return router.currentRoute.value.params.plugin === plugin.name
}

</script>

<style scoped lang="scss">
input {
  width: 90%;
  box-sizing: border-box;
  margin: 5px auto;
  justify-self: center;
}
.toolbox {
  display: flex;
  min-width: 0;
  width: 100%;
}
.sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0px 0px 4px 0px black;
    width: 150px;
    background-color: white;
    height: 100vh;
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



.sidebar-item {
  cursor: pointer;
  transform: translateZ(0);
  transition: background-color 300ms;
  padding: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  i {
    transition: 300ms
  }
  &:hover {
    background-color: #eee;
    i {
      opacity: 1;
    }
  }
  &.active {
    font-weight: bold;
    border-left: 3px solid #194f91
  }
  &.disabled {
    color: #999;
  }
}
.container {
  display: flex;
  flex-grow: 1;
  min-width: 0;
  padding: 5px 10px;
  box-sizing: border-box;
}
.no-tools {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 2em;
  color: #999;
}
</style>
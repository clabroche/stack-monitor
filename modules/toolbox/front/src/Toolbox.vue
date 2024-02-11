<template>
  <div class="toolbox">
    <div class="sidebar">
      <ul>
        <input type="text" ref="searchToolRef" placeholder="Search tool..." v-model="searchToolTerm" autofocus="true" @keypress.enter="chooseFirst">
        <li v-for="plugin of buttonsPlugins" :key="plugin?.name" class="sidebar-item"
          @click="plugin?.click?.()"
          :class="{ active: isActive(plugin) }">
          <div class="item">
            <i class="icon" :class="plugin?.icon" v-if="plugin?.icon"></i>
            <span class="icon" v-if="plugin?.iconText">{{ plugin?.iconText }}</span>
            {{ plugin?.text }}
          </div>
        </li>
      </ul>
    </div>
    <div class="container">
      <router-view v-if="router.currentRoute.value.fullPath !== '/toolbox'"/>
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
import axios from '@clabroche/fronts-app/src/helpers/axios';
import { useRouter } from 'vue-router';

import { onMounted, ref, computed } from 'vue';

const router = useRouter();
/** @type {import('vue').Ref<import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<undefined>[]>} */
const plugins = ref([]);
const searchToolTerm = ref('');
const searchToolRef = ref();
onMounted(async () => {
  /** @type {{data: import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<undefined>[]}} */
  const { data: _plugins } = await axios.get('/plugins/toolbox');
  plugins.value = _plugins?.flat() || [];
  searchToolRef.value?.focus();
});

const buttonsPlugins = computed(() => ([
  ...plugins.value.map((plugin) => plugin.placements.map((placement) => {
    if (typeof placement === 'string') return null;
    return {
      ...plugin,
      text: placement.label,
      icon: placement.icon,
      iconText: placement.iconText,
      click: placement.goTo ? () => {
        if (typeof placement.goTo === 'string') router.push({ path: placement.goTo });
        else {
          router.push({
            ...placement.goTo,
            // @ts-ignore
            path: `/toolbox${(placement.goTo?.path || placement.goTo)}`,
          });
        }
      } : () => { },
      active: placement.active,
    };
  })).flat().filter((f) => f?.text?.toUpperCase().includes(searchToolTerm.value?.toUpperCase())),
]));

function chooseFirst() {
  buttonsPlugins.value?.[0]?.click();
}
/** @param {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<undefined> | undefined | null} plugin */
function isActive(plugin) {
  return router.currentRoute.value.params.plugin === plugin?.name;
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
  align-items: center;
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

.sidebar-item {
  cursor: pointer;
  transform: translateZ(0);
  transition: background-color 300ms;
  padding: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .icon {
    width: 20px;
    transition: 300ms;
    display: flex;
    justify-content: center;

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
  height: 100%;
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

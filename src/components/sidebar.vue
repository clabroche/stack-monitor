<template>
  <div class="sidebar">
      <ul v-if="sortedStack.length">
        <sidebar-item v-for="service of sortedStack" :key="service.label" :service="service"/>
      </ul>
      <div class="system-root">
        <button @click="$router.push({name: 'stack-multiple'})"><i class="fas fa-th" aria-hidden="true"></i></button>
        <section-cmp header="System" class="system" :headerCenter="true">
          <div class="progress-container">
            <label>Mem</label>
            <progress-cmp :percent="mem"></progress-cmp>
          </div>
          <div class="progress-container">
            <label>CPU</label>
            <progress-cmp :percent="cpu * 100"></progress-cmp>
          </div>
          <button @click="System.disconnect()">Disconnect</button>
        </section-cmp>
      </div>
    </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import ProgressVue from './Progress.vue'
import SectionVue from './Section.vue'
import sort from 'fast-sort'
import sidebarItemVue from './sidebarItem.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from '@vue/runtime-core'
export default {
  components: {
    progressCmp: ProgressVue,
    sectionCmp: SectionVue,
    sidebarItem: sidebarItemVue
  },
  props: {
    currentService: {default: null}
  },
  setup() {
    /** @type {import('vue').Ref<import('../models/service').default[]>} */
    const localServices = ref(Stack.services)
    onMounted(async () => {
      await Stack.loadServices()
      localServices.value = Stack.services
    })
    watch(() => Stack.services, () => localServices.value = Stack.services, {deep: true})
    let interval
    const cpu = ref(0)
    const mem = ref(0)
    onMounted(async () => {
      interval = setInterval(async () => {
        const {memPercentage, cpu: _cpu} = await System.getGlobalInfos()
        cpu.value = _cpu
        mem.value = memPercentage
      }, 1000);
    })
    onBeforeUnmount(()=> {
      clearInterval(interval)
    })

    return {
      sortedStack:computed(() => sort(localServices.value).desc((a) => a.enabled)),
      cpu, mem,
      System,
    }
  }
}
</script>

<style lang="scss" scoped>
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
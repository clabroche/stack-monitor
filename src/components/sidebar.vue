<template>
  <div class="sidebar">
      <ul v-if="sortedStack.length">
        <sidebar-item v-for="service of sortedStack" :key="service.label" :service="service"/>
      </ul>
    </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import sort from 'fast-sort'
import sidebarItemVue from './sidebarItem.vue'
import { computed, onMounted, ref, watch } from '@vue/runtime-core'
export default {
  components: {
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
    return {
      sortedStack:computed(() => sort(localServices.value).desc((a) => a.enabled)),
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
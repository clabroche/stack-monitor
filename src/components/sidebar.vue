<template>
  <div class="sidebar">
      <ul v-if="Stack.services.length">
        <sidebar-item v-for="service of sortedStack" :key="service.label" :service="service">
        </sidebar-item>
      </ul>
      <div class="system">
        <section-cmp header="System" class="system">
          <div class="progress-container">
            <label>Mem</label>
            <progress-cmp :percent="+System.globalInfos.memPercentage"></progress-cmp>
          </div>
          <div class="progress-container">
            <label>CPU</label>
            <progress-cmp :percent="+System.globalInfos.cpu *100"></progress-cmp>
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
export default {
  components: {
    progressCmp: ProgressVue,
    sectionCmp: SectionVue,
    sidebarItem: sidebarItemVue
  },
  props: {
    currentService: {default: null}
  },
  data() {
    return {
      System,
      Stack,
      services: Stack.services
    }
  },
  computed: {
    sortedStack() {
      return sort(this.Stack.services).desc((a) => a.enabled)
    }
  },
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

.system button {
  width: 100%;
  margin: 0;
}

</style>
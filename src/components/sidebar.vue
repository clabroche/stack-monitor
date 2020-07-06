<template>
  <div v-if="Stack.stack" class="sidebar">
      <ul v-if="currentService">
        <li v-for="service of Stack.stack" :key="service.label"
          @click="$emit('navigate', service)"
          :class="currentService.label === service.label ? 'active': ''">
            {{service.label}}
            <i class="fas fa-chevron-right"></i>
        </li>
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
export default {
  components: {
    progressCmp: ProgressVue,
    sectionCmp: SectionVue
  },
  props: {
    currentService: {defaul: null}
  },
  data() {
    return {
      Stack,
      System
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
      li {
        cursor: pointer;
        transform: translateZ(0);
        transition: background-color 300ms;
        padding: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        i {
          opacity: 0;
          transition: 300ms
        }
        &:hover {
          background-color: #eee;
          i {
            opacity: 1;
          }
        }
        &.active {
          border-left: 3px solid #194f91
        }
      }
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
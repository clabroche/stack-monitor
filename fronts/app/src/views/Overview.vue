<template>
  <div class="overview-root column">
    <SectionCmp class="home-container">
      <h2><i class="fas fa-home"></i>Mes services</h2>
      <ul>
        <li v-for="service of services" :key="service.label" class="service" :class="{enabled: service.enabled}">
          <Spinner v-if="service.enabled" size="10"></Spinner>
          <i v-else class="fas" :class="{'fa-square': !service.enabled}"></i>
          {{ service.label }}
        </li>
      </ul>
    </SectionCmp>
    <StackChooser class="stack-chooser" :embed="true"></StackChooser>

    <Documentation v-if="docEnabled" class="doc-container"></Documentation>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SectionCmp from '../components/Section.vue'
import stack from '../models/stack'
import StackChooser from '../components/StackChooser.vue'
import Spinner from '../components/Spinner.vue';
import axios from '../helpers/axios';

/** @type {import('vue').Ref<import('../models/service').default[]>} */
const services = computed(() => {
  return stack.services.value.slice().sort((a,b) => b.enabled - a.enabled)
})

const docEnabled = ref(false)

onMounted(async () => {
  const { data } = await axios.get(`/documentation/service/global/is-available`);
  docEnabled.value = !!data
})

</script>

<style lang="scss" scoped>
.overview-root {
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-gap: 10px;


  .section {
    width: 100%;
    height: 100%;
    min-width: 100px;
    overflow: auto;
  }
  .column {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 20px;
  }
  .home-container {
    grid-column: 1 / span 1;
    grid-row: 1;
    min-width: 300px;
    justify-content: center;
    max-height: 50vh;
    h1 {
      text-align: center;
      margin: 0;
    }
    h2 {
      margin: 0;
      i {
        font-size: 50px;
      }
    }
    ul {
      overflow: auto;
      list-style: none;
      padding: 0;
      padding-left: 20px;
      .service {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }
  }

  .doc-container {
    display: flex;
    grid-column: 1 / span 3;
    grid-row: 2;
  }
  
  .stack-chooser {
    grid-column: 2 / span 2;
    grid-row: 1;
  }
}
</style>
<template>
<div class="stack-chooser-root">
  <background-stack-chooser></background-stack-chooser>
  <div class="left">
    <div class="logo">
      Stack Monitor
      <img src="@/assets/rocket.png" alt="">
    </div>
  </div>
  <div class="right">
    <section-cmp class="stack-chooser" v-if="localServices" header="Choose all services to launch">
      <ul>
        <li v-for="service of localServices" :key="'services-'+service.label">
          <input :id="'input-' + service.label" type="checkbox" v-model="service.enabled" :checked="service.enabled ? 'checked' : null">
          <label :for="'input-' + service.label">
            {{service.label}}
          </label>
        </li>
      </ul>
      <div class="actions">
        <button v-if="!isAllEnabled" @click="enableAll">Select all</button>
        <button v-else @click="disableAll">Unselect all</button>
        <button @click="validate" class="success">Validate</button>
      </div>
    </section-cmp>
  </div>
  <div class="version">{{System.version}}</div>
</div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import SectionVue from '../components/Section.vue'
import { computed, onMounted, ref } from 'vue'
import router from '../router/router'
import BackgroundStackChooser from '../components/BackgroundStackChooser.vue'
export default {
  name: 'StackChooser',
  components: {
    sectionCmp: SectionVue,
    BackgroundStackChooser
  },
  setup() {
    const localServices = ref([])
    onMounted(async () => {
      await Stack.loadServices()
      localServices.value = Stack.services
    })

    const validate = async() => {
      await Stack.launchServices(localServices.value.filter(service => service.enabled))
      const enabledServices = await Stack.getEnabledServices()
      router.push({name: 'stack-single', params: {label: enabledServices[0].label}})
    }
    const enableAll = () => localServices.value.map(service => service.enabled = true)
    const disableAll =() => localServices.value.map(service => service.enabled = false)
    return {
      isAllEnabled: computed(() => localServices.value.every(service => service.enabled)),
      localServices,
      System,
      validate, 
      enableAll,
      disableAll
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.stack-chooser-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  .left {
    background-color: rgba(0,0,0,0.1);
    height: 100%;
    flex-grow: 1;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    color: white;
    flex-basis: 0;
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
    .logo {
      font-size: 4em;
      display: flex;
      flex-direction: column;
      text-align: center;
      text-shadow:  0 10px 5px rgba(0,0,0,0.5);
      img {
        width: 200px;
        margin: auto;
      }
    }
  }
  .right {
    flex-grow: 2;
    flex-basis: 0;
    flex-shrink: 0;
  }
  .stack-chooser {
    display: flex;
    margin: auto;
    flex-direction: column;
    border: 1px solid darkgrey;
    box-shadow: 0px 0px 12px 0px #000000;
    max-width: 400px;
    min-width: 200px;
    .header {
      font-size: 2em;
      margin-bottom: 20px;
    }
    .content {
      li {
        margin-bottom: 5px;
        font-size: 1.1em;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
  ul {
    list-style: none;
      margin: 0;
      padding: 0;
  }
  .version {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 10px;
    right: 10px;
  }
}
</style>

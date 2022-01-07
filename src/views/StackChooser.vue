
<template>
<div class="stack-chooser-root">
  <background-stack-chooser :lowResources="true"></background-stack-chooser>
  <left-logo/>
  <div class="right">
    <section-cmp class="stack-chooser" v-if="localServices" header="Choose all services to launch">
      <div class="groups">
        <div v-for="(group) of groups" :key="group.label">
          <div class="group-header" @click="group.show = !group.show">
            <div class="left-header">
              <i class="fas fa-chevron-down" v-if="group.label !== 'All'"></i>
              <h3>{{group.label}} <span>({{group.services?.length}})</span></h3>
            </div>
            <div class="right-header" >
              <button @click.stop="selectGroup(group.label)" class="mini">
                <i class="far fa-check-square" v-if="isGroupSelected(group.label)"></i>
                <i class="far fa-square" v-else></i>
              </button>
            </div>
          </div>
          <ul v-if="group.show || group.label === 'All'">
            <li v-for="service of group.services" :key="'services-'+service.label">
              <input :id="'input-' + service.label" type="checkbox" v-model="service.enabled" :checked="service.enabled ? 'checked' : null">
              <label :for="'input-' + service.label">
                {{service.label}}
              </label>
            </li>
          </ul>
        </div>
      </div>
      <div class="actions">
        <button v-if="!isAllEnabled" @click="enableAll">Select all</button>
        <button v-else @click="disableAll">Unselect all</button>
        <button @click="validate" class="success"><i class="fas fa-play" aria-hidden="true"></i> Launch</button>
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
import { computed, onMounted, reactive, ref } from 'vue'
import router from '../router/router'
import BackgroundStackChooser from '../components/BackgroundStackChooser.vue'
import LeftLogo from '../components/LeftLogo.vue'
export default {
  name: 'StackChooser',
  components: {
    sectionCmp: SectionVue,
    BackgroundStackChooser,
    LeftLogo
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
    const getServicesFromGroup = group => localServices.value.filter(service => service.groups.includes(group)||group === 'All')
    const isGroupSelected = group => getServicesFromGroup(group).every(service => service.enabled)
    return {
      isAllEnabled: computed(() => localServices.value.every(service => service.enabled)),
      groups: computed(() => {
        return localServices.value.reduce((groups, service) => {
          if(service.groups) {
            service.groups.forEach(group => {
              if(!groups[group]) groups[group] = reactive({services: [], label: group})
              groups[group].services.push(service)
            });
          }

          if(!groups['All']) groups['All'] = reactive({services: [], label: "All"})
          groups['All'].services.push(service)

          return groups
        }, {})
      }),
      selectGroup(group) {
        const groupSelected = isGroupSelected(group)
        getServicesFromGroup(group).map(service => service.enabled = !groupSelected)
      },
      isGroupSelected,
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
  h3 {
    margin: 0;
    span {
      color: #8e8e8e;
      font-weight: normal;
    }
  }
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    cursor: pointer;
    border-radius: 10px;
    transition: 300ms background-color linear;
    .left-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &:hover {
      background-color: rgba(0,0,0,0.05);
    }
    i {
      margin: 0;
      padding: 0;
      margin: 0 5px
    }
  }
  .right {
    flex-grow: 2;
    flex-basis: 0;
    flex-shrink: 0;
    .groups {
      overflow: auto;
      max-height: calc(100vh - 150px);
    }
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
        margin-top: 20px;
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
button.mini {
  padding: 5px 10px;
}
</style>

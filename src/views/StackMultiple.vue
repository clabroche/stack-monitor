<template>
  <div class="stack-single">
    <button class="single-button" @click="$router.push({name:'stack-single', params: {label: services[0].label}})"><i class="fas fa-columns"></i></button>
    <tabs :invertColor="true" :tabs="[{label: 'Git', id: 'git'}, {label: 'Logs', id: 'logs'}]" 
      :showLabels="false">
      <template #default="{tab}">
        <transition name="slide-fade">
          <div v-if="tab.id === 'git'" class="tab">
            <section-cmp v-for="service of services" :key="service.label"
              class="service-container"
              :header="service.label"
              >
              <git :currentService="service" :key="service.label"/>
            </section-cmp>
          </div>
          <div v-else-if="tab.id === 'logs'" class="tab">
            <section-cmp v-for="service of services" :key="service.label"
              class="service-container"
              :header="service.label"
              :actions="[{label: 'Restart', click: () => restart(service), icon: 'fas fa-sync'}, {label: 'Stop', click: () => stop(service), icon: 'fas fa-stop'}]"
              >
              <logs :service="service" :key="service.label"></logs>
            </section-cmp>
          </div>
        </transition>
      </template>
    </tabs>
  </div>
</template>

<script>
import { ref } from '@vue/reactivity'
import Section from '../components/Section.vue'
import stack from '../models/stack'
import Logs from '../components/Logs.vue'
import Tabs from '../components/Tabs.vue'
import Git from '../components/Git.vue'
export default {
  components: { SectionCmp: Section, Logs, Tabs, Git },
  name: 'StackSingle',
  setup() {
    const services = ref([])
    setTimeout(() => {
      services.value = stack.services
    }, 1000);
    return {
      services,
      async restart(service) {
        await service.restart()
        stack.services = [...stack.services]
      },
      async stop(service) {
        await service.stop()
        stack.services = [...stack.services]
      },
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.single-button {
  position: absolute;
  top: 10px;
  left: 10px;
}
.stack-single {
  height: 100vh;
  width: 100%;
  &::before {
    content: '';
    z-index: -1;
    position: absolute;
    top: 0;
    left: 0;
    border-bottom: 3px solid #214f6b;
    border-radius: 4px;
    background-color: #0076bc;
    width: 100%;
    height: 100px;
  }
}
.tab {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  overflow: auto;
  height: calc(100vh - 65px);
}
.service-container {
  min-width: 300px;
  width: 45%;
  margin: 10px;
}
</style>
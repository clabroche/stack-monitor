<template>
  <div class="stack-multiple">
    <button class="single-button" @click="$router.push({name:'stack-single', params: {label: services[0].label}})"><i class="fas fa-columns" aria-hidden="true"></i></button>
    <tabs :tabs="[{label: 'Git', id: 'git', icon: 'fab fa-git-alt'}, {label: 'Logs', id: 'logs', icon: 'fas fa-terminal'}]" 
      :showLabels="false">
      <template #default="{tab}">
        <transition name="slide-fade">
          <div v-if="tab.id === 'git'" class="tab">
            <draggable v-model="services"
              v-bind="{animation: 800,}"
              item-key="label"
              :setData="modifyDragItem"
              class="services">
              <template #item="{element: service}">
                <section-cmp
                  class="service-container"
                  :headerBold="true"
                  :noBodyPadding="true"
                  :header="service.label"
                  :actions="[
                    {click: () => goTo(service.git.home), icon: 'fab fa-github'},
                    {click: () => goTo(service.url), icon: 'fas fa-globe'},
                    {click: () => openInVsCode(service), icon: 'fas fa-file-code'},
                    {click: () => openFolder(service), icon: 'fas fa-folder'},
                  ]">
                  <git :currentService="service" :key="service.label" :noStyle="true"/>
                </section-cmp>
              </template>
            </draggable>
          </div>
          <div v-else-if="tab.id === 'logs'" class="tab">
            <draggable v-model="services"
              v-bind="{animation: 200,}"
              ghost-class="ghost"
              item-key="label"
              :setData="modifyDragItem"
              class="services">
              <template #item="{element: service}">
                <section-cmp
                  class="service-container"
                  :header="service.label"
                  :headerBold="true"
                  :noBodyPadding="true"
                  :actions="[
                    {click: () => goTo(service.git.home), icon: 'fab fa-github'},
                    {click: () => goTo(service.url), icon: 'fas fa-globe'},
                    {click: () => openInVsCode(service), icon: 'fas fa-file-code'},
                    {click: () => openFolder(service), icon: 'fas fa-folder'},
                    {click: () => restart(service), icon: 'fas fa-sync'},
                    {click: () => stop(service), icon: 'fas fa-stop'}
                  ]">
                  <logs :service="service" :key="service.label" :noStyle="true"></logs>
                </section-cmp>
              </template>
            </draggable>
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
import draggable from 'vuedraggable'
export default {
  components: {
    SectionCmp: Section,
    Logs,
    Tabs,
    Git,
    draggable
  },
  name: 'StackSingle',
  setup() {
    const services = ref([])
    setTimeout(() => {
      services.value = stack.services
    }, 1000);
    return {
      services,
      modifyDragItem(dataTransfer) {
        let img = new Image()
        img.src = ''
        dataTransfer.setDragImage(img, 0, 0)
      },
      async restart(service) {
        await service.restart()
        stack.services = [...stack.services]
      },
      async stop(service) {
        await service.stop()
        stack.services = [...stack.services]
      },
      goTo(url) {
        window.open(url, '_blank').focus();
      },
      async openInVsCode(service) {
        service.openInVsCode()
      },
      async openFolder(service) {
        service.openFolder()
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

  box-shadow: 2px 2px 5px rgba(0,0,0,0.2),
    -2px -2px 5px rgba(255,255,255,0.2);
  &:hover {
    box-shadow: -2px -2px 5px rgba(0,0,0,0.2),
    2px 2px 5px rgba(255,255,255,0.2);
  }
}
.stack-multiple {
  height: 100vh;
  width: 100%;
}
.tab {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  overflow: auto;
  height: calc(100vh - 65px);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
.services {
  display: grid;
  gap: 20px;
  width: calc(100vw - 90px);
  grid-template-columns: repeat(2, 1fr);
  .service-container {
    min-width: 300px;
    width: 100%;
  }
}
</style>

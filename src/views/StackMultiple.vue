<template>
  <div class="stack-multiple">
    <button class="single-button" @click="$router.push({name:'stack-single', params: {label: services[0].label}})"><i class="fas fa-columns" aria-hidden="true"></i></button>
    <tabs :tabs="tabs" :showLabels="false" ref="tabRef">
      <template #default="{tab}">
        <transition name="slide-fade">
          <div class="tab">
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
                  <component :is="tab.id" :service="service" :key="service.label" :isInMultiMode="true"  :noStyle="true"></component>
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
import Tabs from '../components/Tabs.vue'
import draggable from 'vuedraggable'
import { onMounted, watch } from '@vue/runtime-core'
import PromiseB from 'bluebird'
import axios from '../helpers/axios'

export default {
  components: {
    SectionCmp: Section,
    Tabs,
    draggable,
  },
  name: 'StackSingle',
  setup() {
    const services = ref([])
    const tabs = ref([])
    const tabRef = ref(null)
    onMounted(async () => {
      const {data: plugins} = await axios.get('/plugins/services')
      tabs.value = plugins.sort((a,b) =>a.order - b.order).map(service => ({label: service.name, id: service.name, icon:service.icon, hidden: service.hidden}))
      watch(() => tabRef.value?.currentTab?.id , async ()=> {
        if(!tabRef.value?.currentTab?.id) return 
        services.value = await PromiseB.filter(stack.services, async service => {
        const currentPlugin = tabRef.value.currentTab.id
        if(!service.enabled) return 
        const {data: plugins} = await axios.get('/plugins/services/'+ service.label)
        const availablePlugins = plugins.map(a => a.name)
        const plugin = availablePlugins.find(plugin => plugin === currentPlugin)
        if(!plugin) return 
        return !plugin.hidden
      })
      })
    })
    
    
    return {
      tabRef,
      services,
      tabs,
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
  height: max-content;
  .service-container {
    min-width: 300px;
    width: 100%;
  }
}
</style>

<template>
  <div class="sidebar">
    <ul v-if="buttons.length">
      <sidebar-view-mode-item v-for="button of buttons" :key="button.label" :button="button"/>
    </ul>
    <ul v-if="buttonsBottom.length">
      <doughtnut-chart
        placeholder="CPU"
        :width="'10px'"
        :rayon="17"
        fontSize="11"
        :value="cpu * 100"
        :strokeWidth="3"
        :strokeWidthBg="5"
        :adjustSubtitleLeft="-2"
        :adjustTitleTop="-5"
        :adjustSubtitleTop="-11"
        :padding="14"
        strokeColor="#e900ff"
        strokeColorBg="#761e7e"/>
      <doughtnut-chart
        placeholder="RAM"
        :width="'10px'"
        :rayon="17"
        :value="mem"
        fontSize="11"
        :strokeWidth="3"
        :strokeWidthBg="5"
        :adjustSubtitleTop="-11"
        :adjustSubtitleLeft="-2"
        :adjustTitleTop="-5"
        :padding="14"
        strokeColor="#00f7ff"
        strokeColorBg="#2db7d0"/>
      <sidebar-view-mode-item v-for="button of buttonsBottom" :key="button.label" :button="button"/>
    </ul>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import { onBeforeUnmount, onMounted, ref, watch } from '@vue/runtime-core'
import SidebarViewModeItemVue from './SidebarViewModeItem.vue'
import stack from '../models/stack'
import router from '@/router/router'
import DoughtnutChart from './DoughtnutChart.vue'
export default {
  components: {
    SidebarViewModeItem: SidebarViewModeItemVue,
    DoughtnutChart
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
      buttons:[
        {
          text: 'Single View',
          active: 'single',
          icon: 'fas fa-columns',
          click: () => router.push({name:'stack-single', params: {label: stack.services[0].label}})
        },
        {
          text: 'Multiple view',
          active: 'multiple',
          icon: 'fas fa-th',
          click: () => router.push({name: 'stack-multiple'})
        }
      ],
      buttonsBottom:[
        {
          text: 'Disconnect',
          icon: 'fas fa-unlink',
          click: () => System.disconnect()
        }
      ],
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
  width: 50px;
  background-color: white;
  height: 100vh;
  flex-shrink: 0;
  z-index: 4;
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
<template>
  <div class="sidebar">
    <ul v-if="buttons.length">
      <sidebar-view-mode-item v-for="button of buttons" :key="button.label" :button="button"/>
    </ul>
    <ul v-if="buttonsBottom.length">
      <sidebar-view-mode-item v-for="button of buttonsPlugins" :key="button.label" :button="button"/>
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
import System from '../models/system'
import { computed, onMounted, ref } from 'vue'
import SidebarViewModeItemVue from './SidebarViewModeItem.vue'
import stack from '../models/stack'
import DoughtnutChart from './DoughtnutChart.vue'
import axios from '@/helpers/axios'
import Socket from '@/helpers/Socket';
import { useRouter } from 'vue-router';

export default {
  components: {
    SidebarViewModeItem: SidebarViewModeItemVue,
    DoughtnutChart
  },
  props: {
    currentService: {default: null}
  },
  setup() {
    const router = useRouter(); 
    /** @type {import('vue').Ref<import('../../modules/views').PluginSM<null>[]>} */
    const plugins = ref([])
    const cpu = ref(0)
    const mem = ref(0)

    onMounted(async () => {
      await stack.loadServices()
      const { data: _plugins } = await axios.get('/plugins/sidebar')
      plugins.value = _plugins?.flat() || []
      Socket.socket.on('infos:global', data => {
        const {memPercentage, cpu: _cpu} = data
        cpu.value = _cpu
        mem.value = memPercentage
      })
    })

    return {
      buttons:computed(() => ([
        {
          text: 'Single View',
          active: 'single',
          icon: 'fas fa-columns',
          click: () => router.push({name:'stack-single', params: {label: stack.services.value[0]?.label}})
        },
        {
          text: 'Multiple view',
          active: 'multiple',
          icon: 'fas fa-th',
          click: () => router.push({name: 'stack-multiple'})
        }
      ])),
      buttonsPlugins: computed(() => ([
        ...plugins.value.map(plugin => {
          return plugin.placements.map(placement => {
            if(typeof placement === 'string') return
            return {
              text: placement.label,
              icon: placement.icon,
              click: placement.goTo ? () => router.push(placement.goTo || '/') : () => { },
              active: placement.active
            }
          })
        }).flat().filter(f => f),
      ])),
      buttonsBottom: computed(() => ([
        {
          text: 'Disconnect',
          icon: 'fas fa-unlink',
          click: () => System.disconnect()
        }
      ])),
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
  height: 100%;
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
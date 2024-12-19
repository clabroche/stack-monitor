<template>
  <div class="sidebar">
    <ul v-if="buttons.length">
      <sidebar-view-mode-item v-for="button of buttons" :key="button.label" :button="button"/>
    </ul>
    <ul v-if="buttonsBottom.length">
      <div style="position: relative">
        <SpeedDial :tooltipOptions="{position: 'left', event: 'hover'}" :model="buttonsPlugins.map(button => {
          return button
        })" direction="right" style="" :pt="{
          list: {
            style: {
              zIndex: 100000000,
              position: 'absolute',
              left: '100%',
              border: '1px solid var(--system-border-borderColor)',
              backgroundColor: 'var(--system-sidebar-backgroundColor)',
            }
          }
        }" >
        <template #button="{ toggleCallback, visible }">
          <Button :class="{'speeddial-button-trigger': true, active: visible}" @click="toggleCallback"><i class="fas fa-layer-group" :style="{transition: '300ms', transform: visible ? 'rotate(45deg)' : ''}"></i></Button>
        </template>
        <template #item="{ item, toggleCallback }">
          <Popover appendTo="parent" trigger="mouseenter" placement="top">
            <template #trigger>
              <button @click="item.click();toggleCallback($event)" :class="{ active: $router.currentRoute.value.fullPath.includes(item.active), 'button-speed-dial': true }" class="sidebar-item" :title="item.text">
                <i v-if="item.icon" :class="{ [item.icon]: true }" aria-hidden="true"/>
                <img v-else-if="item.img" :src="item.img" height="10px">
              </button>
            </template>
            <template #content>
              {{item.text}}
            </template>
          </Popover>
        </template>  
      </SpeedDial>
      </div>
      <Popover appendTo="parent" trigger="mouseenter" placement="right">
        <template #trigger>
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
            strokeColor="var(--system-accent-backgroundColor3-lightest)"
            strokeColorBg="var(--system-accent-backgroundColor1)"/>
        </template>
        <template #content>
          CPU
        </template>
      </Popover>
      <Popover appendTo="parent" trigger="mouseenter" placement="right">
        <template #trigger>
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
            strokeColor="var(--system-accent-backgroundColor3-tertiary-lightest)"
            strokeColorBg="var(--system-accent-backgroundColor1-tertiary)"/>
        </template>
        <template #content>
          RAM
        </template>
      </Popover>
      
      <Popover appendTo="parent" trigger="mouseenter" placement="left-start" :showOnCreate="false" >
        <template #trigger>
          <sidebar-view-mode-item key="Themes" :button="{
            text: '',
            icon: 'fas fa-sun',
            click: () => Theme.toggle()
          }"/>
        </template>
        <template #content>
          <div class="groups">
            <div v-for="(group) of groups" class="group">
              {{ group.group }}
              <div class="themes">
                <div v-for="theme of group.themes" class="theme" @click="Theme.apply(theme.id)">
                  <Popover appendTo="parent" trigger="mouseenter" placement="top" :showOnCreate="false">
                    <template #trigger>
                      <div class="view">
                        <div class="viewwindows" :style="{
                          ...(theme.preview.background || {}),
                          border: `4px solid ${theme.preview.background.backgroundColor}`
                        }">
                          <div class="rad" :style="theme.preview.foreground4 || theme.preview.foreground1"></div>
                          <div class="rad" :style="theme.preview.foreground3 || theme.preview.foreground1"></div>
                          <div class="rad" :style="theme.preview.foreground2 || theme.preview.foreground1"></div>
                          <div class="rad" :style="theme.preview.foreground1"></div>
                        </div>
                      </div>
                    </template>
                    <template #content>
                      {{ theme.name || theme.label }}
                    </template>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Popover>
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
import axios from '../helpers/axios'
import Socket from '../helpers/Socket';
import { useRouter } from 'vue-router';
import Theme from '../helpers/Theme'
import Popover from './Popover.vue';
import system from '../models/system'
import SpeedDial from 'primevue/speeddial'

export default {
  components: {
    SidebarViewModeItem: SidebarViewModeItemVue,
    DoughtnutChart,
    Popover,
    SpeedDial
  },
  setup() {
    const router = useRouter(); 
    /** @type {import('vue').Ref<import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>[]>} */
    const plugins = ref([])
    const cpu = ref(0)
    const mem = ref(0)

    onMounted(async () => {
      await stack.loadServices()
      const { data: _plugins } = await axios.get('/plugins/sidebar')
      plugins.value = _plugins?.flat() || []
      Socket.on('infos:global', data => {
        const {memPercentage, cpu: _cpu} = data
        cpu.value = _cpu
        mem.value = memPercentage
      })
    })

    return {
      Theme,
      groups: computed(() => {
        const groupsObj = Object.keys(Theme.themes.value).reduce((agg, themeId) => {
          const theme = Theme.themes.value[themeId]
          theme.id = themeId
          if(!theme.public || !theme.preview) return agg
          const group = theme.group || 'Unknown'
          if(!agg[group]) agg[group] = {group: 'unknown', themes: []}
          agg[group].group = group
          agg[group].themes.push(theme)
          return agg
        }, {})
        const groups = Object.keys(groupsObj).map(key => ({
          group: key,
          themes: groupsObj[key].themes
        }))
        return groups.sort((a, b) => a.group.localeCompare(b.group))
      }),
      buttons:computed(() => ([
        {
          text: 'Overview',
          active: 'overview',
          icon: 'fas fa-home',
          click: () => router.push({ name: 'overview' })
        },
        {
          text: 'Single View',
          active: 'single',
          icon: 'fas fa-columns',
          click: () => {
            const lastVisited = stack.services.value.find((service) => service.label === localStorage.getItem('last-service-visisted'))
            if(lastVisited) router.push({ name: 'stack-single', params: { label: lastVisited.label } })
            else if(stack.services.value[0]) router.push({ name: 'stack-single', params: { label: stack.services.value[0]?.label } })
            else router.push({ name: 'stack-single-no-view'})
          }
        },
        {
          text: 'Multiple view',
          active: 'multiple',
          icon: 'fas fa-th',
          click: () => router.push({name: 'stack-multiple'})
        },
      ])),
      buttonsPlugins: computed(() => ([
        ...plugins.value.map(plugin => {
          return plugin.placements.map(placement => {
            if(typeof placement === 'string') return
            return {
              text: placement.label,
              icon: placement.icon,
              img: system.proxyImg(placement.img),
              click: placement.goTo ? () => router.push(placement.goTo || '/') : () => { },
              active: placement.active
            }
          })
        }).flat().filter(f => f),
      ])),
      buttonsBottom: computed(() => ([
        {
          text: 'Settings',
          active: 'settings',
          icon: 'fas fa-cog',
          click: () => router.push({name: 'settings-no-view'})
        },
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
  background-color: var(--system-sidebar-backgroundColor);
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
.groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.view{
  display:flex;
  align-items: center;
  justify-content: center;
  width:50px;
  height:50px;
  position: relative;
  .viewwindows{
    position:absolute;
    width:50px;
    height:50px;
    border-radius:50%;
    box-sizing: border-box;
    overflow:hidden;
    .rad{
      position:absolute;
      width:170%;
      height:170%;
      background:rgb(118, 218, 255);
      animation: rotate 10s linear infinite;
      &:nth-child(1){
        left: -50%;
        top:26%;
        border-radius:35%;
        animation-delay: -4s;
      }
      &:nth-child(2){
        left:-30%;
        top:30%;
        border-radius:37%;
        animation-delay: -3s;
      }
      &:nth-child(3){
        left:-20%;
        top:33%;
        border-radius:40%;
        animation-delay: -2s;
      }
      &:nth-child(4){
        left:0;
        top:35%;
        border-radius:40%;
        animation-delay: -1s;
      }
    }
  }
}
@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    50% {
        transform: rotate(180deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
.themes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  .theme {
    cursor: pointer;
    .background {
      width: 40px;
      height: 40px;
      border-radius: 40px;
      border: 1px solid var(--system-border-borderColor);
      position: relative;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      .foreground {
        position: absolute;
        width: 100%;
        height: 1px;
      }

      .foreground-1 {
        height: 10px;
        transform: rotate(45deg);
      }
      .foreground-2 {
        height: 5px;
        transform: rotate(90deg);
      }
      .foreground-3 {
        height: 3px;
        transform: rotate(135deg);
      }
      .foreground-4 {
        transform: rotate(180deg);
      }
    }
  }
}
.logo {
  width: 100%;
}
.button-speed-dial, .speeddial-button-trigger {
  outline: none;
  border-radius: 5px;
  transition: 200ms;
  transition-property: font-size, box-shadow;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  margin: 0 5px;
  font-size: 1em;
  box-shadow: none;
  color: var(--system-tertiary-color);
  &:hover {
    background: var(--system-secondary-backgroundColor);
    color: var(--system-secondary-color);
    box-shadow: none;
    transform: none;
    img {
      filter: contrast(0) brightness(1.6);
    }
  }
  &.active {
    @include card();
    img {
      filter: contrast(0) brightness(2);
    }
  }
  i {
    font-size: 1.2em;
  }
  img {
    width: 1.2em;
    height: 1.2em;
    object-fit: contain;
    filter: contrast(0) brightness(2) brightness(0.5);
    
  }
}
</style>

<style lang="scss" >
.p-speeddial-list {
    opacity:0;
  }
.p-speeddial-open {
  .p-speeddial-list {
    opacity:1;
  }
}

</style>
<template>
  <div class="tabs" :class="{[direction]: true}">
    <div class="buttons" :class="{invert:invertColor}">
      <template v-for="tab of availableTabs" :key="tab.label" >
        <Popover appendTo="parent" trigger="mouseenter" placement="right" :fullWidth="true">
          <template #trigger>
            <button @click="currentTab = tab;save()" :class="{active: tab?.id === currentTab?.id}">
              <div v-if="tab.label && !tab.icon">{{tab.label}}</div>
              <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
              <label v-if="showLabels">{{tab?.data?.value?.length || tab?.data?.length || 0}}</label>
              <div v-if="tab?.warning" class="badge warning">{{ tab.warning }}</div>
            </button>
          </template>
          <template #content>
            {{ tab.label }}
          </template>
        </Popover>
      </template>
    </div>
    <div class="content" :style="contentCss">
      <slot :key="currentTab?.id" :data="currentTab?.data?.value || currentTab?.data" :tab="currentTab" v-if="currentTab"/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router';
import Popover from './Popover.vue';

const router = useRouter(); 


const props = defineProps({
  tabs: {
    /** @type {Tab[]} */
    default: []
  },
  direction: {default: ''},
  showLabels: {default: true},
  contentCss: {default: () => ({})},
  invertColor: {default: false}
})
/** @type {import('vue').Ref<Tab | undefined>} */
const currentTab = ref()
const load = () => {
  if(props.tabs) {
    const tabId = localStorage.getItem('tab')
    currentTab.value = props.tabs.find(tab => tab.id === tabId) || props.tabs[0]
  }
}
onMounted(() => {
  if(router.currentRoute.value.query.tab) {
    localStorage.setItem('tab', router.currentRoute.value.query.tab?.toString())
  }
  load()
})
watch(() => props.tabs, ()=> {
  if(!currentTab.value && props.tabs?.[0]) {
    load()
  }
})
watch(() => router.currentRoute.value, ()=> {
  const goTo = router.currentRoute.value.query.tab
  if(goTo) currentTab.value = props.tabs?.find(t => t.id === goTo)
}, {immediate: true})

const save = () => {
  const toSave = currentTab.value?.id ? currentTab.value.id : ''
  localStorage.setItem('tab', toSave)
  router.push({path: router.currentRoute.value.fullPath, query: Object.assign({}, router.currentRoute.value.query || {},  {tab: toSave})})

}

const availableTabs = computed(() => {
  return props.tabs.filter((tab) => !tab.hidden)
})

defineExpose({
  currentTab: currentTab
})

/**
 * @typedef {{
 * id: string,
 * hidden: boolean,
 * label: string,
 * icon: string,
 * data?: any,
 * warning?: number
 * }} Tab
 */
</script>

<style lang="scss" scoped>

.tabs {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: calc(100vh - 220px);
  &.left {
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    .buttons {
      flex-direction: column;
      height: auto;
      align-items: flex-start;
      justify-content: flex-start;
      width: max-content;
      height: max-content;
      max-height: 100%;
      position: sticky;
      top: 40px;
      margin: 0;
      button {
        height: 45px;
        width: 100%;
        &.active {
          background-color: rgba(0,0,0,0.5);
          color: white;
          border: 0;
          @include card()
        }
      }
    }
  }
}
.buttons {
  display: flex;
  justify-content: center;
  top: 0;
  border-radius: 5px;
  align-items: flex-end;
  margin: auto;
  margin-bottom: 10px;
  flex-shrink: 0;
  width: max-content;
  gap: 5px;
  background-color: var(--system-sections-backgroundColor);
  z-index: 1;
  border: 1px solid var(--system-border-borderColor);
  button {
    position: relative;
    outline: none;
    margin: 0;
    color: var(--system-tertiary-color);
    transition: 200ms;
    border-bottom: 0;
    height: 40px;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    font-size: 1em;
    box-shadow: none;
    i {
      font-size: 1.2em;
    }
    &.active {
      border-radius: 0;
      color: #777;
      @include card()

    }
    label {
      background-color: #fff;
      margin-left: 10px;
      color: #0076bc;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      padding-top: 2px;
      box-sizing: border-box;
    }
  }
}
.content {
  position: relative;
  flex-grow: 1;
}
.badge {
  position: absolute;
  right: 0px;
  top: 0px;
  transform: translateX(50%) translateY(-50%);
  z-index: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  &.warning {
    background-color: #e5b100;
  }
}
</style>
<template>
  <div class="tabs">
    <div class="buttons" :class="{invert:invertColor}">
      <button @click="currentTab = tab;save()" v-for="tab of availableTabs" :key="tab.label" :class="{active: tab?.id === currentTab?.id}">
        <div v-if="tab.label && !tab.icon">{{tab.label}}</div>
        <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
        <label v-if="showLabels">{{tab?.data?.value?.length || tab?.data?.length || 0}}</label>
        <div v-if="tab?.warning" class="badge warning">{{ tab.warning }}</div>
      </button>
    </div>
    <div class="content">
      <slot :key="currentTab?.id" :data="currentTab?.data?.value || currentTab?.data" :tab="currentTab" v-if="currentTab"/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter(); 


const props = defineProps({
  tabs: {
    /** @type {Tab[]} */
    default: []
  },
  showLabels: {default: true},
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
}
.buttons {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin: auto;
  margin-bottom: 10px;
  height: 45px;
  flex-shrink: 0;
  width: 90%;
  &.invert {
    button.active {
      color: #fff;
      border-bottom-color: #fff;
      background: transparent;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2) inset,
      -2px -2px 5px rgba(255,255,255,0.2) inset;
    }
    button {
      color: #ccc;
      border-color: rgba(0,0,0,0.1);
      border-color: transparent;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2),
      -2px -2px 5px rgba(255,255,255,0.2);
    }
  }
  button {
    position: relative;
    outline: none;
    color: #999;
    border-radius: 5px 5px 0 0;
    transition: 200ms;
    transition-property: font-size, box-shadow;
    border-bottom: 0;
    height: 40px;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    margin: 0 5px;
    font-size: 1em;
    box-shadow: 5px 5px 10px rgba(0,0,0,0.2),
      -5px -5px 10px rgba(255,255,255,0.8);
    border: 1px solid #efefef;
    &:hover {
      box-shadow: none;
      transform: none;
    }
    i {
      font-size: 1.2em;
    }
    &.active {
      border-radius: 5px 5px 0 0;
      color: #777;
      margin-bottom: -1px;
      border-bottom: 3px solid #0076bc;
      box-shadow: 2px 2px 7px rgba(0,0,0,0.2) inset,
      -5px -5px 7px rgba(255,255,255,0.6) inset;
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
<template>
  <div class="tabs">
    <div class="buttons" :class="{invert:invertColor}">
      <button @click="currentTab = tab;save()" v-for="tab of tabs" :key="tab.label" :class="{active: tab?.id === currentTab?.id}">
        <div v-if="tab.label && !tab.icon">{{tab.label}}</div>
        <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
        <label v-if="showLabels">{{tab?.data?.value?.length || tab?.data?.length || 0}}</label>
      </button>
    </div>
    <div class="content">
      <slot :data="currentTab?.data?.value || currentTab?.data" :tab="currentTab" v-if="currentTab"/>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
export default {
  props: {
    tabs: {default: () => []},
    showLabels: {default: true},
    invertColor: {default: false}
  },
  setup(props) {
    const currentTab = ref()
    onMounted(() => {
      if(props.tabs) {
        const tabId = localStorage.getItem('tab')
        currentTab.value = props.tabs[tabId || 0]
      }
    })
    return {
      currentTab,
      save() {
        localStorage.setItem('tab', props.tabs.findIndex(tab => tab.id === currentTab.value.id))
      }
    }
  }
}
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
    }
    button {
      color: #ccc;
    }
  }
  button {
    outline: none;
    color: #ccc;
    border-radius: 5px 5px 0 0;
    transition: 200ms;
    transition-property: font-size;
    border-bottom: 0;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    margin: 0 1px;
    font-size: 1em;
    &:hover {
      box-shadow: none;
      transform: none;
    }
    i {
      font-size: 1.2em;
    }
    &.active {
      border-radius: 5px 5px 0 0;
      height: 45px;
      color: #000;
      font-size: 1.4em;
      margin-bottom: -1px;
      border-bottom: 3px solid #0076bc;
      i {
        font-size: 1.8em;
      }
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
</style>
<template>
  <button @click="button.click()" :class="{active: isActive }" class="sidebar-item" :title="button.text">
    <i :class="{[button.icon]: true}" aria-hidden="true"/>
  </button>
</template>

<script setup>
import router from '@/router/router';
import { computed } from 'vue';

const props = defineProps({
  button: {
    /** @type {SideBarButton | null}*/
    default: null
  }
})
const isActive = computed(() => {
  return router.currentRoute.value.fullPath.includes(props.button.active)
})

/**
 * @typedef {{active: string, click: (...args: any[]) => any, icon: string, text: string}} SideBarButton
 */
</script>

<style lang="scss" scoped>
.sidebar-item {
  cursor: pointer;
  transform: translateZ(0);
  transition: background-color 300ms;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  margin: auto;
  margin-top: 5px;
  z-index: 2;
  
  &:hover {
    background-color: #eee;
    i {
      opacity: 1;
    }
  }
  &.active {
    font-weight: bold;
  }
  &.disabled {
    color: #999;
  }
}
button {
  outline: none;
  border-radius: 5px 5px 0 0;
  transition: 200ms;
  transition-property: font-size, box-shadow;
  border-bottom: 0;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  margin: 0 5px;
  font-size: 1em;
  border: 1px solid #efefef;
  color: #aaa;
  border-color: transparent;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.2),
    -2px -2px 5px rgba(255,255,255,0.2);
  &.active {
    background: transparent;
    border-radius: 5px 5px 0 0;
    color: #777;
    margin-bottom: -1px;
    border-bottom: 3px solid #0076bc;
    box-shadow: 2px 2px 7px rgba(0,0,0,0.2) inset,
    -5px -5px 7px rgba(255,255,255,0.6) inset;
  }
  &:hover {
    box-shadow: none;
    transform: none;
  }
  i {
    font-size: 1.2em;
  }
}
</style>
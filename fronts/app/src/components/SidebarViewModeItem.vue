<template>
  <button @click="button.click()" :class="{active: isActive }" class="sidebar-item" :title="button.text">
    <i :class="{[button.icon]: true}" aria-hidden="true"/>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter(); 

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
    background-color: var(--system-secondary-sidebar-backgroundColor);
    i {
      opacity: 1;
    }
  }
}
button {
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
  }
  &.active {
    @include card();
  }
  i {
    font-size: 1.2em;
  }
}
</style>
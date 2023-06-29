<template>
  <div @click="$router.push({name: 'stack-single', params: {label: service.label}})"
    class="sidebar-item"
    :class="{active: isActive, disabled: !service.enabled, crashed: service.crashed}">
      {{service.label}}
      <i class="fas fa-chevron-right"  aria-hidden="true"></i>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter()

const props = defineProps({
  service: {
    /** @type {import('../models/service').default | null} */
    default: null
  }
})
const isActive = computed(() => {
  const url = router.currentRoute.value.fullPath.split('?')[0]
  const serviceLabel = url.split('/').filter(a => a).pop()
  return props.service?.label ? encodeURIComponent(props.service.label) === serviceLabel : false
})
</script>

<style lang="scss" scoped>
.sidebar-item {
  cursor: pointer;
  transform: translateZ(0);
  transition: background-color 300ms;
  padding: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  i {
    opacity: 0;
    transition: 300ms
  }
  &:hover {
    background-color: #eee;
    i {
      opacity: 1;
    }
  }
  &.active {
    font-weight: bold;
    border-left: 3px solid #194f91
  }
  &.disabled {
    color: #999;
  }
  &.crashed {
    color: red;
  }
}
</style>
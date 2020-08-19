<template>
  <div @click="$router.push({name: 'stack-single', params: {label: service.label}})"
    class="sidebar-item"
    :class="{active: isActive(service), disabled: !service.enabled}">
      {{service.label}}
      <i class="fas fa-chevron-right"  aria-hidden="true"></i>
  </div>
</template>

<script>
export default {
  props: {
    service: {default: null}
  },
  methods: {
    /** @param {import('../models/stack').default} service*/
    isActive(service) {
      const url = this.$route.fullPath.split('?')[0]
      const serviceLabel = url.split('/').pop()
      return service.label === serviceLabel
    }
  }
}
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
    border-left: 3px solid #194f91
  }
  &.disabled {
    color: #999;
  }
}
</style>
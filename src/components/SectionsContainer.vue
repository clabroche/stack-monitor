<template>
  <div class="sections-container-root">
    <div class="header" @click="isOpen = !isOpen; $emit('is-open', isOpen)">
      <h2>{{header}}</h2>
      <div>
        <i class="fas fa-chevron-down" aria-hidden="true"></i>
      </div>
    </div>
    <transition name="appear">
      <div v-if="isOpen" class="body">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    header: {default: ''},
    defaultIsOpen: {default: false}
  },
  data() {
    return {
      isOpen: false
    }
  },
  mounted() {
    this.isOpen = this.defaultIsOpen
  }
}
</script>

<style lang="scss" scoped>
.sections-container-root {
  display: flex;
  flex-direction: column;
  h2 {
    margin: 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    &:hover {
      background-color: rgba(0,0,0,0.05);
    }
  }
}
.body {
  max-height: 1000px;
  overflow: hidden;
}
.appear-enter-active, .appear-leave-active {
  transition: 0.3s;
}
.appear-enter, .appear-leave-to /* .appear-leave-active below version 2.1.8 */ {
  max-height: 0;
}
</style>
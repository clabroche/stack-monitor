<template>
  <div class="card-root" :class="{[color]: true, mini}">
    <div class="card-container">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  color: {default: 'blue'},
  mini: {default: false},
})
</script>

<style lang="scss" scoped>

.card-root {
  width: 300px;
  height: auto;
  &.mini {
    border-radius: 1000px;
    .card-container {
      flex-direction: row;
    }
  }
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  &::before, &::after {
    content: "";
    width: 150%;
    height: 75%;
    border-radius: 100%;
    position: absolute;
    top: 0;
    right: -100%;
    transform: rotate(20deg);
    transform-origin: top;

  }
  &::after {
    height: 45%;
  }
  .card-container {
    width: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
  }

  
  &.blue {
    @include card-tertiary()
  }
  &.purple {
    @include card()
  }
  
  &.orange {
    @include card-secondary()
  }
}

</style>
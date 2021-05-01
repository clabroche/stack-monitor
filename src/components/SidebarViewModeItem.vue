<template>
  <button @click="button.click()" :class="{active: isActive(button)}" class="sidebar-item" :title="button.text">
    <i :class="{[button.icon]: true}" aria-hidden="true"/>
  </button>
</template>

<script>
export default {
  props: {
    button: {default: null}
  },
  methods: {
    isActive(button) {
      return this.$route.fullPath.includes(button.active)
    }
  }
}
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
  color: #999;
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
  box-shadow: 5px 5px 10px rgba(0,0,0,0.2),
    -5px -5px 10px rgba(255,255,255,0.8);
  border: 1px solid #efefef;
  &.active {
    color: #fff;
    border-bottom-color: #fff;
    background: transparent;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2) inset,
    -2px -2px 5px rgba(255,255,255,0.2) inset;
  }
  & {
    color: #ccc;
    border-color: rgba(0,0,0,0.1);
    border-color: transparent;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2),
    -2px -2px 5px rgba(255,255,255,0.2);
  }
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
  }
</style>
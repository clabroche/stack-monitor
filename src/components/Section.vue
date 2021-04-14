<template>
  <div class="section" :class="{noStyle}">
    <div class="background">
    </div>
    <div class="title" v-if="header || actions">
      {{header}}
      <div class="actions">
        <button
          @click="action.click()"
          v-for="action of activeActions"
          :key="action.label"
          class="action small" :class="{mini: !action.label && action.icon}">
          <i :class="action.icon" v-if="action.icon"  aria-hidden="true"></i>
          <span class="text">{{action.label}}</span>
        </button>
      </div>
    </div>
    <div class="content" :style="{maxHeight}">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    header: {default: ''},
    actions: {default:() => ([])},
    maxHeight: {default: 'auto'},
    noStyle: {default: false},
  },
  computed: {
    activeActions() {
      return this.actions.filter(action => !action.hidden)
    }
  }
}
</script>

<style lang="scss" scoped>
$mainColor: rgb(235, 235, 235);
$secondaryColor: rgb(238, 238, 238);
$shadow: rgb(165, 177, 179);
.section {
  width: calc(100%);
  margin: 5px 0;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 1px 2px 0px rgba(0, 0, 0, 0.2);
  position: relative;
  .background{
    background: $mainColor;
    background: linear-gradient(93deg, $mainColor 0%, $secondaryColor 100%);
    box-shadow:
      0 0 5px 0 $shadow;
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;
    &>div{
      position: absolute;
      top: 0;
      left: 0;
    }
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
      box-shadow:
        inset 0 0 50px $mainColor,
        inset -20px 0 300px $mainColor,
        0 0 50px #fff,
        -10px 0 80px $mainColor,
        10px 0 80px $mainColor;
    }
    &::after {
      height: 45%;
    }
  }
  .title {
    font-size: 1.2em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    box-sizing: border-box;
    position: relative;
    text-align: left;
  }
  .actions {
    display: flex;
    .action.mini {
      width: max-content;
      i {
        margin: 0;
      }
    }
  }
  .content {
    overflow: auto;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    transform: translateZ(0);
    -webkit-transform: translateZ(0)
  }
}
.noStyle {
  box-shadow: none;
  border: none;
  border-left: 1px solid #999;  
  &:first-of-type {
    border: none;
  }
  .background {
    display: none;
  }
}
</style>
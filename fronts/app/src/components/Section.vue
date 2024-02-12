<template>
  <div class="section" :class="{noStyle, noBodyPadding, headerBold,  headerCenter}">
    <div class="background">
    </div>
    <div class="title" v-if="header || actions?.length">
      <div v-if="header">
        {{header}}
      </div>
      <slot v-else name="header">
      </slot>
      <div class="actions">
        <template v-for="action of activeActions" :key="action.label">
          <Popover appendTo="parent" trigger="mouseenter" placement="top" :disable="!action.hover">
            <template #trigger>
              <button
                @click="action?.click?.()"
                class="action small" :class="{mini: !action.label && action.icon || action.small, active: action.active}">
                <i :class="action.icon" v-if="action.icon"  aria-hidden="true"></i>
                <span class="text" v-if="action.label">{{action.label}}</span>
              </button>
            </template>
            <template #content>
              <span class="text" v-if="action.hover">{{action.hover}}</span>
            </template>
          </Popover>
        </template>
        
      </div>
    </div>
    <div class="content" :style="{maxHeight}">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Popover from './Popover.vue';

const props = defineProps({
  header: {default: ''},
  actions: {
    default:() => (/**@type {Action[]}*/([]))
  },
  maxHeight: {default: 'auto'},
  noStyle: {default: false},
  noBodyPadding: {default: false},
  headerBold: {default: false},
  headerCenter: {default: false},
})

const activeActions = computed(() => {
  return props.actions.filter(action => !action.hidden)
})

/**
 * @typedef {{
 *   click?: (...args: any[])=> any,
 *   icon?: string,
 *   hidden?: boolean,
 *   label?: string,
 *   hover?: string,
 *   small?: boolean,
 *   active?: boolean,
 * }} Action
 */
</script>

<style lang="scss" scoped>
$mainColor: rgb(240, 240, 240);
$secondaryColor: rgb(255, 255, 255);
$shadow: rgb(165, 177, 179);
.section {
  min-width: 0;
  width: calc(100%);
  box-sizing: border-box;
  border-right: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #dbdbdb;
  border-radius: 2px;
  position: relative;
  .background{
    background: $mainColor;
    background: linear-gradient(93deg, $mainColor 0%, $secondaryColor 100%);
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
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    box-sizing: border-box;
    position: relative;
    text-align: left;
    font-weight: bold;
    font-size: 1.4em;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    width: max-content;
    justify-content: flex-end;
    gap: 5px;
    .action {
      gap: 5px;
      margin: 0;
    }
    .action.mini {
      width: max-content;
      i {
        margin: 0;
      }
    }
    .action.active {
      background: none;
      background-color: green;
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    overflow: auto;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    transform: translateZ(0);
    -webkit-transform: translateZ(0)
  }
}
.noStyle {
  border: none;
  border-left: 1px solid #999;  
  box-shadow: 0px 0px transparent;
  &:first-of-type {
    border: none;
  }
  .background {
    display: none;
  }
}
.noBodyPadding {
  &>.content {
    padding: 0;
  }
}
.headerCenter {
  .title {
    justify-content: center;
  }
}
.content {
  .content {
    .title {
      font-size: 1.2em;
    }
  }
}
</style>
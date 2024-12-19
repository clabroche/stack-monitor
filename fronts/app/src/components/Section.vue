<template>
  <div class="section" :class="{noStyle, noBodyPadding, headerBold,  headerCenter, noRadius}">
    <div class="background">
    </div>
    <div class="title" v-if="header || actions?.length || $slots.header">
      <div v-if="header">
        {{header}}
      </div>
      <slot v-else name="header">
      </slot>
      <div class="actions">
        <slot name="actions"></slot>
        <template v-for="action of activeActions" :key="action.label">
          <Popover appendTo="parent" trigger="mouseenter" placement="top" :disable="!action.hover">
            <template #trigger>
              <button
                @click="action?.click?.()"
                class="action small" :class="{mini: !action.label && action.icon || action.small, active: action.active}" :style="action.style || {}">
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
  noRadius: { default: false },
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
$mainColor: rgb(234, 234, 234);
$secondaryColor: rgb(255, 255, 255);
$shadow: rgb(165, 177, 179);
.section {
  min-width: 0;
  width: calc(100%);
  box-sizing: border-box;
  border-right: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--system-border-borderColor);
  border-radius: 5px;
  position: relative;
  .background{
    border-radius: 5px;
    background: var(--system-sections-backgroundColor);
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
    $borderRadius: 100px;
    &::before, &::after {
      content: "";
      width: 100000px;
      height: 100000px;
      border-radius: 100px;
      position: absolute;
      bottom: calc(50%);
      left: calc(50%);
      transform: rotate(20deg);
      transform-origin: bottom left;
      box-shadow: inset 0 10px 100px var(--system-sections-innerShadow);
    }
    &::after {
      left: calc(50%);
      bottom: calc(50%);
      transform: rotate(200deg);
      // right: 100px;
      // bottom: calc(50% + 100px);

      // transform: rotate(80deg);
      // transform-origin: bottom left;
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
      box-shadow: none;
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

.noRadius {
  border-radius: 0;  
  .background {
    border-radius: 0;  

  }
}
</style>
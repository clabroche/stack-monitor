<template>
  <div class="popover-root" v-if="!disable" :class="{fullWidth}">
    <div ref="refTrigger" class="trigger">
      <slot name="trigger" ></slot>
    </div>
    <div ref="refContent" class="content" :style="{maxHeight, overflow: maxHeight !== 'auto' ? 'auto' : 'inherit'}">
      <slot name="content"/>
    </div>
  </div>
  <div class="popover-root" v-else>
    <slot name="trigger"/>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'; // optional for styling
import 'tippy.js/dist/svg-arrow.css'
import 'tippy.js/themes/light-border.css';
import 'tippy.js/dist/backdrop.css';
import 'tippy.js/animations/shift-away.css';

export default {
  props: {
    maxHeight: {default: 'auto'},
    trigger: { default: 'click' },
    placement: { default: 'bottom' },
    appendTo: {default: 'parent'},
    disable: {default: false},
    fullWidth: {default: false},
    showOnCreate: {default: false}
  },
  setup(props) {
    /** @type {import('vue').Ref<Element | import('tippy.js').MultipleTargets | null>} */
    const refTrigger = ref(null)
    const refContent = ref(null)
    const tippyInstance = ref()
    onMounted(() => {
      if(!refTrigger.value) return
      tippyInstance.value = tippy(refTrigger.value, {
        trigger: props.trigger,
        maxWidth: '100vh',
        content: refContent.value,
        placement: props.placement,
        interactive: true,
        allowHTML: true,
        appendTo: props.appendTo || document.querySelector('body'),
        arrow: true,
        hideOnClick: true,
        animation: 'shift-away',
        theme: 'light-border',
        showOnCreate: props.showOnCreate,
      })
    })
    return {
      tippyInstance,
      refTrigger,
      refContent,
      tippy
    }
  }
}
</script>

<style scoped lang="scss">
.fullWidth {

  &.popover-root,
  .trigger {
    width: 100%;
  }
}
</style>
<style lang="scss">
.tippy-content {
  background-color: var(--system-sidebar-backgroundColor);
  color: var(--system-color);
}
.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-arrow:before{
  border-right-color: var(--system-sidebar-backgroundColor) !important;
}

.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-arrow:before{
  border-left-color: var(--system-sidebar-backgroundColor) !important;
}
.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-arrow:before{
  border-top-color: var(--system-sidebar-backgroundColor) !important;
}
.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-arrow:before{
  border-bottom-color: var(--system-sidebar-backgroundColor) !important;
}
</style>
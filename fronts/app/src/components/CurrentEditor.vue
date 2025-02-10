<template>
  <Popover trigger="mouseenter" appendTo="parent" :style="{display: 'inline-block', width: 'max-content'}" triggerHeight="18px" :placement="direction" v-if="!loading">
    <template #trigger>
      <img :class="{['filter-dark']: dark}" v-if="currentEditor?.icon" :src="currentEditor?.icon" alt="editor icon"  aria-hidden="true" :title="currentEditor?.title" @click="$emit('openEditor', currentEditor.key)"/>
      <span v-else>Choose your default editor</span>
    </template>
    <template #content>
      <div class="icons">
        <img
          v-for="editor of availableEditors"
          :alt="`Editor icon: ${editor}`"
          :src="allEditors[editor]?.icon"
          :style="{width: '35px', height: '35px'}"
          @click="setDefaultEditor(editor)"
          class="filter-dark"/>
      </div>
    </template>
  </Popover>
  <Spinner v-else size="18" :noColor="true"/>
</template>

<script setup>
import Popover from './Popover.vue';
import {useCurrentEditor} from '../models/currentEditor.js';
import Spinner from './Spinner.vue';

const props = defineProps({
  service: {
    /** @type {import('../models/service').default | undefined} */
    default: undefined
  },
  direction: {default: 'bottom'},
  dark: {default: false},
})

const {
  availableEditors, loading, allEditors, setDefaultEditor, currentEditor
} = useCurrentEditor(props.service)
</script>


<style scoped lang="scss">
img {
  width: 18px;
  height: 18px;
  filter: invert(1);
  &.filter-dark {
    filter:  grayscale(1) opacity(0.7)
  }
  cursor: pointer;
}
.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
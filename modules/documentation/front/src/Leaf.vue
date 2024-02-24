<template>
  <div class="label" :class="{
    active: leaf?.path === activeLeaf?.path,
    isFile: !leaf.isDir,
    isDir: leaf.isDir
  }" @click.stop="leaf.isDir ? toggleLeaf() : $emit('go', leaf)">
    <i class="icon-folder fas fa-chevron-right" v-if="leaf.isDir" :class="{opened }"></i>
    <i class="fas fa-file" v-else></i>
    {{ leaf.name || leaf.path }}
  </div>
  <div v-if="leaf?.isDir">
    <div class="children" v-if="leaf?.children && opened">
      <Tree :tree="leaf.children" @go="$emit('go', $event)" :activeLeaf="activeLeaf"></Tree>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Tree from './Tree.vue';

const props = defineProps({
  leaf: {
    /** @type {import('./Index.vue').Leaf | null} */
    default: null,
  },
  activeLeaf: {
    /** @type {import('./Index.vue').Leaf | null} */
    default: null,
  },
});

const opened = ref(props.leaf.opened);
const toggleLeaf = () => {
  opened.value = !opened.value;
};
</script>

<style lang="scss" scoped>

.label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px;
  box-sizing: border-box;
  transition: 300ms;
  &:hover {
    background-color: var(--system-sections-backgroundColor-darker);
    color: var(--system-color);
  }
  i {
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  &.active {
    background-color: var(--system-accent-backgroundColor1);
    color: white;
    border-right: 5px solid var(--system-accent-backgroundColor1-darkest)
  }
  &.isFile {
    cursor: pointer;
  }
  &.isDir {
    cursor: pointer;
  }
}
.icon-folder {
  transition: 300ms;
  transform-origin: center;
  &.opened {
    transform: rotate(90deg);

  }
}

.children {
  margin-left: 25px;
}
</style>

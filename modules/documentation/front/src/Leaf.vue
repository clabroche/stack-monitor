<template>
  <div class="label" :class="{
    active: leaf?.path === activeLeaf?.path,
    isFile: !leaf.isDir,
    isDir: leaf.isDir
  }" @click.stop="leaf.isDir ? toggleLeaf() : $emit('go', leaf)">
    <i class="fas fa-minus" v-if="leaf.isDir && opened"></i>
    <i class="fas fa-plus" v-if="leaf.isDir && !opened"></i>
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
  i {
    width: 20px;
  }
  &.active {
    background-color: rgba(0,0,0,0.6);
    color: white;
  }
  &.isFile {
    cursor: pointer;
  }
  &.isDir {
    cursor: pointer;
  }
}

.children {
  margin-left: 25px;
}
</style>

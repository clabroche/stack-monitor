<template>
  <div class="root">
    <div v-for="leaf of tree" :key="leaf.name">
      <div class="label" :class="{active: leaf?.path === activeLeaf?.path, isFile: !leaf.isDir}" @click.stop="leaf.isDir ? '' : $emit('go', leaf)">
        <i class="fas fa-folder" v-if="leaf.isDir"></i>
        <i class="fas fa-file" v-else></i>
        {{ leaf.name || leaf.path }}
      </div>
      <div v-if="leaf?.isDir">
        <div class="children" v-if="leaf?.children">
          <Tree :tree="leaf.children" @go="$emit('go', $event)" :activeLeaf="activeLeaf"></Tree>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// @ts-ignore
import Tree from './Tree.vue'

defineEmits([
  'go'
])

defineProps({
  tree: {
    required: true,
    /** @type {import('./index').Leaf[]} */
    // @ts-ignore
    default: () => ([])
  },
  activeLeaf: {
    required: true,
    /** @type {import('./index').Leaf | null | undefined} */
    default: undefined
  }
})
</script>

<style lang="scss" scoped>
.root {
  display: flex;
  flex-direction: column;
}
.children {
  margin-left: 15px;
}
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
}
</style>
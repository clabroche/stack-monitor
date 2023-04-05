<template>
  <div class="root">
    <div v-for="leaf of tree" :key="leaf">
      <div class="label" :class="{active: leaf === activeLeaf, isFile: !leaf.isDir}" @click.stop="leaf.isDir ? '' : $emit('go', leaf)">
        <i class="fas fa-folder" v-if="leaf.isDir"></i>
        <i class="fas fa-file" v-else></i>
        {{ leaf.name || leaf.path }}
      </div>
      <div v-if="leaf?.isDir">
        <div class="children">
          <tree :tree="leaf.children" @go="$emit('go', $event)" :activeLeaf="activeLeaf"></tree>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import Tree from './Tree.vue'

const emit = defineEmits([
  'go'
])

const props = defineProps({
  tree: {
    required: true,
    default: () => ([])
  },
  activeLeaf: {
    
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
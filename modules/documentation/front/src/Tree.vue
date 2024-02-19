<template>
  <div class="root">
    <div v-for="leaf of tree" :key="leaf.name">
      <Leaf
        @go="$emit('go', $event)"
        :leaf="leaf"
        :activeLeaf="activeLeaf"
      />
    </div>
  </div>
</template>

<script setup>
import Leaf from './Leaf.vue';

defineEmits([
  'go',
]);

defineProps({
  tree: {
    required: true,
    /** @type {import('./Index.vue').Leaf[]} */
    // @ts-ignore
    default: () => ([]),
  },
  activeLeaf: {
    /** @type {import('./Index.vue').Leaf | null | undefined} */
    default: undefined,
  },
});
</script>

<style lang="scss" scoped>
.root {
  display: flex;
  flex-direction: column;
}
</style>

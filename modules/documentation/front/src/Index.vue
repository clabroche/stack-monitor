<template>
  <section-cmp
    class="configs-root"
    :key="service?.label || 'global'">
    <div class="header">
      <h2>Documentation</h2>
    </div>
    <div class="container">
      <Tree class="tree" :tree="tree" @go="goTo" :activeLeaf="activeLeaf"></Tree>
      <div class="markdown">
        <Markdown :key="activeLeaf?.path" :modelValue="currentPage" @update:modelValue="updateCurrentPage"/>
      </div>
    </div>
  </section-cmp>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Service from '../../../../fronts/app/src/models/service';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import Markdown from '../../../../fronts/app/src/components/Markdown.vue';
import Tree from './Tree.vue';

const route = useRoute();

const props = defineProps({
  service: {
    default: null,
    type: Service,
  },
});

/** @type {import('vue').Ref<Leaf[]>} */
const tree = ref([]);

/** @type {import('vue').Ref<Leaf[]>} */
const flatTree = ref([]);
const currentPage = ref(undefined);
/** @type {import('vue').Ref<Leaf | null | undefined>} */
const activeLeaf = ref(null);
const label = ref(props.service?.label || 'global');
/** @param {*} page */
async function updateCurrentPage(page) {
  if (!activeLeaf.value?.path) return;
  const { data } = await axios.post(`/documentation/service/${label.value}/${encodeURIComponent(activeLeaf.value.path)}`, { page });
  currentPage.value = data;
}

watch(() => route.query.leaf, () => {
  const leaf = flatTree.value.find((leaf) => leaf.path === route.query.leaf?.toString());
  if (leaf) return goTo(leaf);
  return null;
});

onMounted(async () => {
  const { data } = await axios.get(`/documentation/service/${label.value}`);
  const { data: flat } = await axios.get(`/documentation/service/${label.value}/flat`);
  flatTree.value = flat;
  tree.value = data;
  if (!currentPage.value) {
    if (route.query.leaf) {
      const leaf = flatTree.value.find((leaf) => leaf.path === route.query.leaf?.toString());
      if (leaf) return goTo(leaf);
    }
    const defaultFile = tree.value.find((leaf) => leaf.name?.toUpperCase() === 'INDEX.MD');
    if (defaultFile) {
      await goTo(defaultFile);
    } else {
      const firstFile = tree.value[0];
      if (firstFile) await goTo(firstFile);
    }
  }
  return null;
});

/** @param {Leaf} leaf */
async function goTo(leaf) {
  activeLeaf.value = leaf;
  currentPage.value = undefined;
  const { data } = await axios.get(`/documentation/service/${label.value}/${encodeURIComponent(leaf.path)}`);
  currentPage.value = data;
}

/**
 * @typedef {import('../../backend/index').Leaf} Leaf
 */
</script>
<style lang="scss" scoped>
h2 {
  margin-top: 0;
}
.tree {
  width: 200px;
}
.container {
  display: flex;
  overflow: auto;
}
.markdown {
  background-color: #fff;
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
  flex-grow: 1;
}
</style>

<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Documentation</h2>
    </div>
    <div class="container">
      <Tree :tree="tree" @go="goTo" :activeLeaf="activeLeaf"></Tree>
      <div class="markdown">
        <Markdown :source="currentPage || ''"/>
      </div>
    </div>
  </section-cmp>
</template>

<script setup>
import Service from '@/models/service'
import SectionCmp from '@/components/Section.vue'
import axios from '@/helpers/axios'
import { onMounted, ref, watch } from 'vue'
// @ts-ignore
import Tree from './Tree.vue'
// @ts-ignore
import Markdown from 'vue3-markdown-it'
import {useRoute} from 'vue-router'
const route = useRoute()

const props = defineProps({
  service: {
    default: null,
    required: true,
    type: Service
  },
})

/** @type {import('vue').Ref<Leaf[]>} */
const tree = ref([])

/** @type {import('vue').Ref<Leaf[]>} */
const flatTree = ref([])
const currentPage = ref(null)
/** @type {import('vue').Ref<Leaf | null | undefined>} */
const activeLeaf = ref(null)

watch(() => route.query.leaf, () => {
  const leaf = flatTree.value.find((leaf) => leaf.path === route.query.leaf?.toString())
  if(leaf) return goTo(leaf)
})

onMounted(async () => {
  const {data} = await axios.get(`/documentation/service/${props.service.label}`)
  const {data: flat} = await axios.get(`/documentation/service/${props.service.label}/flat`)
  flatTree.value = flat
  tree.value = data
  if(!currentPage.value) {
    if(route.query.leaf) {
      const leaf = flatTree.value.find((leaf) => leaf.path === route.query.leaf?.toString())
      if(leaf) return goTo(leaf)
    }
    const defaultFile = tree.value.find(leaf => leaf.name?.toUpperCase() === 'INDEX.MD')
    if(defaultFile) {
      await goTo(defaultFile)
    } else {
      const firstFile = tree.value[0]
      if(firstFile) await goTo(firstFile)
    }
  }
})

/** @param {Leaf} leaf */
async function goTo(leaf) {
  activeLeaf.value = leaf
  currentPage.value = null
  const { data } = await axios.get(`/documentation/service/${props.service.label}/${encodeURIComponent(leaf.path)}`)
  currentPage.value = data
}


/**
 * @typedef {import('./index').Leaf} Leaf
 */
</script>
<style lang="scss" scoped>
h2 {
  margin-top: 0;
}
.container {
  display: flex;
  gap: 10px;
  width: 100%;
  margin: auto;
  height: calc(100vh - 400px - 40px);
  @media (max-width: 1300px) { 
    height: calc(100vh - 500px - 40px);
  }
  @media (max-width: 800px) { 
    height: calc(100vh - 650px - 40px);
  }
  box-sizing: border-box;
}
.markdown {
  background-color: #fff;
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
  flex-grow: 1;
}
</style>
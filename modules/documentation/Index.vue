<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Documentation</h2>
    </div>
    <div class="container">
      <tree :tree="tree" @go="goTo" :activeLeaf="activeLeaf"></tree>
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
import { onMounted, ref } from 'vue'
import Tree from './Tree.vue'
import Markdown from 'vue3-markdown-it'

const props = defineProps({
  service: {
    default: null,
    required: true,
    type: Service
  },
})

const tree = ref([])
const currentPage = ref(null)
const activeLeaf = ref(null)

onMounted(async () => {
  const {data} = await axios.get(`/documentation/service/${props.service.label}`)
  tree.value = data
  if(!currentPage.value) {
    const defaultFile = tree.value.find(leaf => leaf.name?.toUpperCase() === 'INDEX.MD')
    if(defaultFile) {
      goTo(defaultFile)
    }
  }
})

async function goTo(leaf) {
  activeLeaf.value = leaf
  currentPage.value = null
  const { data } = await axios.get(`/documentation/service/${props.service.label}/${encodeURIComponent(leaf.path)}`)
  currentPage.value = data
}
</script>
<style lang="scss" scoped>
h2 {
  margin-top: 0;
}
.container {
  width: 100%;
  margin: auto;
  height: calc(100vh - 400px);

  @media (max-width: 1300px) { 
    height: calc(100vh - 500px);
  }
  @media (max-width: 800px) { 
    height: calc(100vh - 650px);
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
.container {
  display: flex;
  gap: 10px;
}
</style>
<template>
  <div class="stack-create-root">
    <Splitter style="height: 100%">
        <SplitterPanel :size="1" :style="{minWidth: '160px'}" class="leftPanel"> 
          <Tree :value="nodes" :selectionKeys="selectedKey" @update:selectionKeys="navigate" selectionMode="single" size="small" class="w-full md:w-[30rem]">
          </Tree>
        </SplitterPanel>
        <SplitterPanel :size="75" class="rightPanel">
          <Crypto v-if="selectedKey['crypto']"></Crypto>
          <Environments v-else-if="selectedKey['environments']"></Environments>
          <Parsers v-else-if="selectedKey['parsers']"></Parsers>
        </SplitterPanel>
    </Splitter>
  </div>
</template>

<script setup>
import Environments from './settings/Environments.vue';
import Crypto from './settings/Crypto.vue';
import Parsers from './settings/Parsers.vue';
import { computed, onMounted, ref, watch } from 'vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Tree from 'primevue/tree';
import { useRouter } from 'vue-router';
let selectedKey = ref({})
const router = useRouter()
watch(() => router.currentRoute.value, () => {
  selectedKey.value = {[router.currentRoute.value.params.setting?.toString()]: true}
}, {deep: true})
onMounted(() => {
  const tab = router.currentRoute.value.params.setting
  selectedKey
  if(tab) selectedKey.value = {[tab?.toString()]: true}
  if(!Object.keys(selectedKey.value).length) selectedKey.value = {[nodes.value[0].key]: true}
})

function navigate(res) {
  router.push({name: 'settings', params: {setting: Object.keys(res)[0]}})
}

const nodes = computed(() => ([
  {
    key: 'crypto',
    label: 'Security',
    icon: 'fas fa-shield-halved',
  },
  {
    key: 'environments',
    label: 'Environments',
    icon: 'fas fa-home',
  },
  {
    key: 'parsers',
    label: 'Parsers',
    icon: 'fas fa-scroll',
  },
]));

</script>

<style lang="scss" scoped>
  .stack-create-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }
  .rightPanel {
    padding: 10px;
  }
  .leftPanel {
    background-color: var(--p-content-background);
  }
  ::v-deep {
    .p-splitter {
      background-color: transparent;
      border: none;
      .p-tree-node-toggle-button {
        display: none;
      }
      .p-splitterpanel {}
    }
  }
</style>
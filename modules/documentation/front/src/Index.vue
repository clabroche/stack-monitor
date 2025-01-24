<template>
  <section-cmp
    class="configs-root"
    :key="service?.label || 'global'">
    <div class="header">
      <h2>Documentation</h2>
    </div>
    <Splitter style="height: 100%">
      <SplitterPanel :size="1" :style="{minWidth: '160px'}" class="leftPanel"> 
          <Tree :value="tree" class="w-full md:w-[30rem] treeLeft" v-if="tree.length" :key="resync">
            <template #default="slot">
              <div class="line" :class="{active: slot.node?.id === currentNode?.id}">
                <Leaf :key="slot.node.id" :node="slot.node" @select="select(slot.node)" :tree="tree" @updateDoc="updateDoc($event)" @deleteDoc="deleteDoc($event)"/>
              </div>
            </template>
            <template #url="slotProps">
              <a :href="slotProps.node.data">{{ slotProps.node.label }}</a>
            </template>
        </Tree>
        <div>
          <button :style="{width: '100%'}" class="button-add" @click="addNewDoc"><i class="fas fa-plus" /></button>
        </div>
      </SplitterPanel>
      <SplitterPanel :size="75" class="rightPanel">
        <template v-if="currentNode">
          <Markdown v-model="currentNode.text" @update:modelValue="updateDoc(currentNode)"></Markdown>
        </template>
      </SplitterPanel>
    </Splitter>
  </section-cmp>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import Service from '../../../../fronts/app/src/models/service';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import {v4} from 'uuid'
import Tree from 'primevue/tree';
import Leaf from './Leaf.vue';
import Markdown from '../../../../fronts/app/src/components/Markdown.vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import {Plugins, Sortable} from '@shopify/draggable';


const props = defineProps({
  service: {
    default: null,
    type: Service,
  },
});
const tree = ref([])
const currentNode = ref()
const resync = ref(0)

let sortable
const sort = async ({data: {oldIndex, newIndex}}) => {
  if(oldIndex === newIndex) return
  const element  = tree.value.splice(oldIndex, 1)[0]
  tree.value.splice(newIndex, 0, element)
  const {data: _tree} = await axios.post('/documentation/tree/sort', tree.value)
  await reload()
}

async function reload() {
  const {data: _tree} = await axios.get('/documentation/tree', {
    params: {
      serviceId: props.service?.label
    }
  })
  if(_tree) tree.value = (_tree||[]).sort((a, b) => a.position - b.position)
  if(!currentNode.value) currentNode.value = tree.value[0]
  await enableSorting()
  resync.value++
}
onMounted(reload)

let enablingInProgress = false
async function enableSorting() {
  if(enablingInProgress) return
  enablingInProgress = true
  sortable?.destroy() 
  setTimeout(() => {
    sortable = new Sortable(document.querySelectorAll('.p-tree-root-children'), {
      delay: 200,
      draggable: '.p-tree-node-leaf',
      sortAnimation: {
        duration: 200,
        easingFunction: 'ease-in-out',
      },
      plugins: [Plugins.SortAnimation],
    })
    sortable.on('sortable:stop', sort)
    enablingInProgress = false
  }, 0);
}

async function addNewDoc() {
  const {data: _tree} = await axios.post('/documentation/tree', {
    key: v4(),
    serviceId: props.service?.label,
    label: 'New doc...',
    position: tree.value.length
  })
  reload()
  select(tree.value.find(t => t.id === _tree.id))
} 

async function updateDoc(doc) {
  const {data: _tree} = await axios.post(`/documentation/tree/${doc.id}`, doc)
  reload()
} 

async function deleteDoc(doc) {
  const {data: _tree} = await axios.delete(`/documentation/tree/${doc.id}`, doc)
  reload()
} 


// watch(() => currentNode.value, async() => {
//   currentDocument.value = await axios.get(`/documentation/services/${props.service.label}/${currentNode.value.key}`)
// })


function select(node) {
  currentNode.value = node
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
  flex-direction: column;
  overflow: auto;
  button {
    width: max-content;
  }
}
.leftPanel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.markdown {
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
  flex-grow: 1;
  &::v-deep {
    ul {
      li {
        margin-left: 20px;
        list-style: disc;
      }
    }
  }
}
.line {
  position: relative;

  display: flex;
  transition: 300ms;
  padding: 10px;
  &.active {
    background-color:var(--system-accent-backgroundColor1);
    color:white;
  }
}
.p-tree {
  padding: 0;
}
::v-deep {
  .p-tree-node-content {
    padding: 0;
  }
  .p-tree-node-toggle-button {
    display: none;
  }
  .p-tree-node-label {
    flex-grow: 1;
    overflow: hidden;
  }
  .p-tree-node-children {
    padding: 0 30px
  }
}
.button-add {
  flex-grow: 1;
}
</style>

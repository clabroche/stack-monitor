<template>
  <Splitter height="100%" style="height: 100%">
    <SplitterPanel :size="1" :style="{minWidth: '160px'}" class="left-panel">
      <Button fluid icon="fas fa-plus" label="Add new" size="small" class="add-button" variant="text" @click="add"></Button>
      <Tree :value="nodes" v-model:selectionKeys="currentScriptKey" selectionMode="single" size="small" class="w-full md:w-[30rem]">
        <template #default="slotProps">
          <div class="line">
            <div class="label">
              {{ slotProps.node.label }}
            </div>
          </div>
        </template>
      </Tree>
    </SplitterPanel>
    <SplitterPanel :size="75" class="right-panel">
      <template v-if="currentScript">
        <Message size="small" severity="warn" closable>
          Caution: This script is designed to execute as is with an eval(). <br/>Please ensure it does not contain harmful content.
        </Message>
        <SectionCmp header="Parser" class="parsers" :actions="currentScript? [{
          icon: 'fas fa-trash',
          style: {
            background: 'red'
          },
          click: deleteCurrentParser
        }]: []">
          <Editor
            @blur="save"
            v-model="currentScript.transform"
            :style="{height: '100%'}"
            v-if="currentScript" language="typescript"
          />
        </SectionCmp>
      </template>
    </SplitterPanel>
  </Splitter>
  <Modal ref="addModalRef">
    <template #header>Add new parser</template>
    <template #body>
      <IftaLabel>
        <InputText v-model="scriptToAdd.label" fluid></InputText>
        <label>Label</label>
      </IftaLabel>
    </template>
  </Modal>

  <Modal ref="deleteModalRef">
    <template #header>Delete parser</template>
    <template #body>
      Are you sure to delete this parser ?
    </template>
  </Modal>
</template>

<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import SectionCmp from '../../components/Section.vue';
import notification from '../../helpers/notification';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Modal from '../../components/Modal.vue';
import IftaLabel from 'primevue/iftalabel';
import InputText from 'primevue/inputtext';
import Tree from 'primevue/tree';
import Parsers from '../../models/Parsers';
import Message from 'primevue/message';

function getDefaultParser() {
  return {label: '', readonly: false, transform: /* typescript */`
/**
 * @type {(msg: LogMessage, service?: Service | null) => LogMessage}
 */
const parser = (line) => {
  return line;
}
module.exports = parser;

/**
 * @typedef {{
 *  msg: string,
 *  raw: string,
 *  timestamp: number,
 *  prompt?: boolean,
 *  id: string,
 *  source?: 'stdout' | 'stderr'
 *  json?: Record<any, any> | any[] | null,
 *  debug?: Record<any, any> | any[] | null,
 *  isSeparator?: boolean,
 *  label: string,
 *  pid?: number | null,
 *  hide?: boolean,
 *  cmd?: {cmd: string, args: string[], options: import('child_process').ExecOptions, status: 'running' | 'error' | 'exited'},
 * }} LogMessage
 */
    `}
}

const currentScriptKey = ref({})
const currentScript = ref()
const addModalRef = ref()
const deleteModalRef = ref()
const scriptToAdd = ref(getDefaultParser())
/** @type {import('vue').Ref<ReturnType<typeof getDefaultParser>[]>} */
const parsers =ref([])

const nodes = computed(() => parsers.value.filter(parser =>!parser.readonly).map((parser) => {
  return {
    key: parser.id,
    label: parser.label 
  }
}));

watchEffect(() => {
  const key = Object.keys(currentScriptKey.value || {})[0]
  currentScript.value = parsers.value.find((a)=> a.id === key)
})


async function reload() {
  parsers.value = await Parsers.all()
}

async function save() {
  await Parsers.update(currentScript.value)
}

async function add() {
  const result = await addModalRef.value.open().promise
  if(result) {
    await Parsers.create(scriptToAdd.value)
      .then(() => notification.next('success', 'Parser created'))
      .catch(() => notification.next('error', 'Parser cant be saved'))
  } 
  reload()
  scriptToAdd.value = getDefaultParser()
}


const router = useRouter()
onMounted(async() => {
  await reload()
  const parserId = router.currentRoute.value.query.parser
  currentScript.value = parserId  
    ? currentScript.value = parsers.value.find(a => a.id === parserId)
    : currentScript.value = parsers.value[0]
  currentScriptKey.value[currentScript.value?.id] = true
})
watch(() => currentScriptKey, () => {
  const parser = currentScriptKey.value.id
  router.push({query: {...router.currentRoute.value.query,parser,}})
}, {deep: true})

async function deleteCurrentParser() {
  const result = await deleteModalRef.value.open().promise
  if(!result) return
  Parsers.delete(currentScript.value.id)
      .then(() => notification.next('success', 'Parser deleted'))
      .catch(() => notification.next('error', 'Parser cant be deleted'))
  await reload()
}
</script>

<style lang="scss" scoped>
.line {
  display: flex;
  align-items: center;
}
.parsers {
  height: 100%;
}
.left-panel {
  padding-right: 10px;
}
.right-panel {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.add-button {
  margin: 0;
  margin-bottom: 5px

}
.remove-button {
  padding: 2px;
  width: max-content;
  width: 20px;
}
:deep(.p-tree-selectable) {
  padding: 0;
}
:deep(.p-tree-node-label) {
  flex-grow: 1;
}
.line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
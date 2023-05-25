<template>
  <div header="Logs" @is-open="isOpen = $event" :defaultIsOpen="isOpen" v-if="service.enabled"
    :style="{ maxHeight: isInMultiMode ? '400px' : 'inherit' }"
  >
    <div class="header">
      <template v-if="countJSON || countDebug">
        <div class="input-container">
          <i class="fas fa-search"></i>
          <input type="text" v-model="jsonPathSearch" placeholder="JSON path...">
        </div>
        <div class="separator"></div>
      </template>
      <div class="input-container">
        <i class="fas fa-times"></i>
        <input
          type="text" v-model="filterSearch"
          :placeholder="isInclude ? 'Include...' : 'Exclude...'">
        <div class="radios">
          <div>
            <input type="radio" id="include" :checked="isInclude" :value="isInclude" @input="isInclude = true">
            <label for="include">Include</label>
          </div>
          <div>
            <input type="radio" id="exclude" :checked="!isInclude" :value="!isInclude" @input="isInclude = false">
            <label for="exclude">Exclude</label>
          </div>
        </div>
      </div>
      <div class="separator"></div>
      <div class="input-container">
        <div class="radios">
          <div>
            <div>Display</div>
            <select v-model="numberToDisplay">
              <option :value="10">10</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="150">150</option>
              <option :value="200">200</option>
              <option :value="500">500</option>
              <option :value="800">800</option>
              <option :value="1000">1000</option>
              <option :value="1500">1500</option>
              <option :value="2000">2000</option>
            </select>
            <div>lines</div>
          </div>
          <div>
            <input type="checkbox" :checked="simplifiedMode" v-model="simplifiedMode">
            <label for="exclude">Simplified mode</label>
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <sectionCmp v-if="isOpen" header="Logs" :noStyle="noStyle"
        :actions="[
          { icon: 'fas fa-list', label: `${countLine}`, small: true, hidden: !countLine, active: !mode, click: () => mode = '' },
          { icon: 'fas fa-bug', label: `${countDebug}`, small: true, hidden: !countDebug, active: mode === 'debug', click: () => mode = 'debug' },
          { label: `{} ${countJSON}`, small: true, hidden: !countJSON, active: mode === 'json', click: () => mode = 'json' },
          { icon: 'fas fa-chevron-down', click: () => scroll(true) },
          { icon: 'fas fa-trash', click: () => clear() },
        ]">
          <div class="terminal" ref="jsonsRef">
            <div class="line" :class="{separator: line.isSeparator, json: line.json, debug: line.debug}" v-for="line of displayedLines" :key="line.id" >
              <div v-html="line.msg" v-if="simplifiedMode"></div>
              <div v-else-if="line.debug" >
                <h2 class="section-header">Debug</h2>
                <div class="section-content">
                  <div class="section-actions">
                    <button class="small" v-if="false">Copied</button>
                    <button class="small" v-else @click="copy(JSON.stringify(line.debug))">Copy</button>
                    <button class="small">
                      <router-link :to="{ name: 'JSONFormatter', query: { json: JSON.stringify(line.debug) } }">
                        Open in json-viewer
                      </router-link>
                    </button>
                    <button class="small" @click.stop="findSolution(/**@type {any}*/(line.debug))">
                      Find a solution
                    </button>
                  </div>
                  <JsonTreeView :maxDepth="1" :data="transformerJSON(line.debug)" :copyable="true" :expand-depth="1" :show-double-quotes="true"/>
                </div>
              </div>
              <div v-else-if="line.json"  >
                <h2 class="section-header">JSON</h2>
                <div class="section-content">
                  <div class="section-actions">
                    <button class="small" v-if="false">Copied</button>
                    <button class="small" v-else @click="copy(JSON.stringify(line.json))">Copy</button>
                    <button class="small">
                      <router-link :to="{ name: 'JSONFormatter', query: { json: JSON.stringify(line.json) } }">
                        Open in json-viewer
                      </router-link>
                    </button>
                    <button class="small" @click.stop="findSolution(/**@type {any}*/(line.json))">
                      Find a solution
                    </button>
                  </div>
                  <JsonTreeView :maxDepth="1" :data="transformerJSON(line.json)" :copyable="true" :expand-depth="1" :show-double-quotes="true"/>
                </div>
              </div>
              <div v-html="line.msg" v-else></div>
            </div>
          </div>
      </sectionCmp>
    </div>
  </div>
  <sectionCmp v-else>
    <div class="not-launch">
      <i class="fas fa-ban"></i>
      Launch this service to view logs
    </div>
  </sectionCmp>


  <Modal ref="findSolutionModal" cancelString="No" validateString="Yes">
    <template #header>
      Find solution from AI
    </template>
    <template #body="{data: tokens}">
      Are you sure ? This have a cost of ~{{ tokens.price }}$
    </template>
  </Modal>

  <Modal ref="findSolutionResultModal" cancelString="OK" :noValidate="true">
    <template #header>
      Find solution from AI
    </template>
    <template #body="{data: result}">
      <pre>
        {{result?.trim()}}
      </pre>
    </template>
  </Modal>
</template>

<script setup>
import Socket from '@/helpers/Socket';
import sectionCmp from '@/components/Section.vue';
// @ts-ignore
import { JsonTreeView } from "json-tree-view-vue3";
// @ts-ignore
import jsonpath from 'jsonpath'
import 'vue-json-viewer/style.css'
import { computed, onMounted, ref, nextTick } from 'vue';
import Modal from '@/components/Modal.vue'
import Service from '@/models/service'
import notification from '@/helpers/notification';

const props = defineProps({
  service: { 
    /** @type {import('@/models/service').default | null}*/
    default: null
  },
  noStyle: { default: false },
  isInMultiMode: {default: false}
})

/** @type {import('vue').Ref<import('xterm').Terminal | null>} */
const terminal = ref(null)
/** @type {import('vue').Ref<HTMLElement | null>} */
const logsContainer = ref(null)
/** @type {import('vue').Ref<HTMLElement | null>} */
const jsonsRef = ref(null)
const filterSearch = ref('')
const isOpen = ref(true)
const isInclude = ref(false)
/** @type {import('vue').Ref<LogMessage[]>} */
const logs = ref([])
const jsonPathSearch = ref('')
const findSolutionModal = ref()
const simplifiedMode = ref(false)
const numberToDisplay = ref(100)
const findSolutionResultModal = ref()
const mode = ref('')

/** @param {string} data */
function copy(data) {
  navigator.clipboard.writeText(data)
    .then(() => notification.next('success', 'Data copied to clipboard'))
}

const countJSON = computed(() => {
  let count = logs.value.reduce((count, line) => line.json && !line.debug ? count + 1 : count, 0)
  if(count > numberToDisplay.value) count = numberToDisplay.value
  return count
})
const countDebug = computed(() => {
  let count = logs.value.reduce((count, line) => line.debug ? count + 1 : count, 0)
  if(count > numberToDisplay.value) count = numberToDisplay.value
  return count
})
const countLine = computed(() => {
  let count = logs.value.length
  if(count > numberToDisplay.value) count = numberToDisplay.value
  return count
})

/** @param {any} json */
function transformerJSON(json) {
  if (jsonPathSearch.value) {
    try {
      const res = jsonpath.query(json, jsonPathSearch.value)
      if (res.length === 1) return JSON.stringify(res['0'])
      else return JSON.stringify(res)
    } catch (error) {
      // console.error(error)
    }
  } 
  return JSON.stringify(json)
}
const displayedLines = computed(() => {
  if(mode.value === 'debug') {
    return logs.value.filter((line) => line.isSeparator || (line.debug && isLineIncluded(line))).slice(-numberToDisplay.value)
  } else if(mode.value === 'json') {
    return logs.value.filter(line => line.isSeparator || (line.json && !line.debug && isLineIncluded(line))).slice(-numberToDisplay.value)
  } 
  return logs.value.filter((line) => line.isSeparator || (isLineIncluded(line))).slice(-numberToDisplay.value)
})

/** @param {Record<string, string>} data */
async function findSolution(data) {
  const tokens = await Service.getTokens(JSON.stringify(data))
  const res = await findSolutionModal.value.open(tokens).promise
  if (res) {
    const review = await Service.findSolutionFromAi(JSON.stringify(data))
    await findSolutionResultModal.value.open(review).promise
  }
}

/** @param {LogMessage} line */
const isLineIncluded = (line) => {
  const message = filterSearch.value
  if(line.isSeparator) return true
  if (!message) return true
  const filters = message.includes(' | ')
    ? message.split(' | ')
    : [message]
  if(line.msg.includes('Mongoose') || line.msg.includes('nodemon'))console.log(filters.filter(a => a).map((filter => {
    const res = line.msg.toUpperCase().match(new RegExp(escapeRegExp(filter), 'gi'))
    return isInclude.value ? !!res : !res
  })), line.msg)
  return isInclude.value
    ? filters.filter(a => a).some((filter => {
      const res = line.msg.toUpperCase().match(new RegExp(escapeRegExp(filter), 'gi'))
      return !!res
    }))
    : filters.filter(a => a).every((filter => {
      const res = line.msg.toUpperCase().match(new RegExp(escapeRegExp(filter), 'gi'))
      return !res
    }))
}

onMounted(() => mounted())
Socket.socket.on('conf:update', () => {
  if (logsContainer.value && !logsContainer.value?.children.length && terminal.value) {
    terminal.value.open(logsContainer.value)
  }
})
async function mounted() {
  logs.value = await props.service.getLogs()
  Socket.socket.on('logs:update', (/** @type {LogMessage}*/data) => {
    if (data.label !== props.service.label) return
    logs.value.push(data)
    scroll()
  })
  Socket.socket.on('logs:clear', data => {
    if (data.label !== props.service.label) return
    logs.value = []
    terminal.value?.clear()
  })
  scroll(true)
}

async function clear() {
  props.service.clear()
  logs.value = []
}

/** @param {string} text */
function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
/**
 * 
 * @param {boolean} force 
 * @param {HTMLElement | null} customElement 
 */
async function scroll(force = false, customElement = null) {
  const container = customElement || jsonsRef.value
  if(!container) return
  const shouldScroll = container.scrollTop + container.clientHeight === container.scrollHeight
  await nextTick()
  if (shouldScroll || force) container.scrollTop = container.scrollHeight
}

/**
 * @typedef {import('../../server/models/Service').LogMessage} LogMessage
 */
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#terminal {
  width: 100%;
  position: relative;
}
.not-launch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 2em;
  color: #777
}
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  position: relative;
  z-index: 1;
  margin: 10px 0;
  &>.separator {
    border-left: 1px solid lightgrey;
    height: 40px;
  }
}
.terminal {
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

.input-container {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    border-radius: 10px;
    padding: 5px;
  }

  button {
    height: auto;
    padding: 5px 10px;
  }
}

.main-content {
  display: flex;

  .right {
    flex-shrink: 0;
    width: 300px;
    overflow: auto;
  }
}

.radios {
  display: flex;
  flex-direction: column;
  &>div {
    display: flex;
    align-items: center;
    gap: 5px;
    input {
      margin: 0;
    }
  }
}

.main-content  {
  background: none;
  right: 3px;
  top: 0;
  width: calc(100% - 6px);
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
  margin: 0;
  z-index: 100;
  .section {
    margin: 0;
  }
}

.terminal {
  display: flex;
  flex-direction: column;
  line-break: anywhere;
  overflow: auto;
  .line {
    border-left: 2px solid #ccc;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    padding-left: 10px;
    margin: 0px 0;
    will-change: background-color;
    transition: 300ms;
    .section-actions {
      display: none;
      button {
        width: max-content;
        a {
          color: white;
          text-decoration: none;
        }
      }
    }
    .section-header {
      margin: 0;
      padding: 0 10px;
      background-color: #000000;
      color: white;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      position: relative;
      z-index: 1;
    }
    .section-content {
      border-left: 4px solid #000000;
      border-bottom-left-radius: 4px;
      padding-left: 10px;
    }
    &:hover {
      background-color: rgba(0,0,0,0.05);
      .section-content {
        position: relative;
        .section-actions {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 2px;

        }
      }
    }
    &.json {
      padding: 0;
      margin: 10px 0;
      border: none;
      .section-header {
        background-color: #e9d6b2;
      }
      .section-content {
        border-color: #e9d6b2
      }
    }
    
    &.debug {
      padding: 0;
      margin: 10px 0;
      border: none;
      .section-header {
        background-color: #ac32c4;
      }
      .section-content {
        border-color: #ac32c4
      }
    }
    &.separator {
      border-left: none;
      margin: 20px auto;
      display: inline-block;
      width: max-content;
      font-weight: bold;
    }
    
  }
}
</style>

<style lang="scss">
@import '~xterm/css/xterm.css';
.xterm-decoration-top {
  background-color: orange;
  color: white;
}

.json-view-item {
  &.root-item {
    padding: 10px 0;
  }
  button {
    background: none;
    box-shadow: none;
    background-color: transparent !important;
    margin: 0;
    padding: 0;
    width: max-content;
    &:hover {
      background-color: rgba(0,0,0,0.1) !important;
    }
  }
  .value-key {
    white-space: normal;
  }
}
</style>

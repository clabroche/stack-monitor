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
      <div class="pids-container" v-if="pids">
        <div class="pid" :class="{active: !currentPidView}" @click="currentPidView = null; scroll(true)">All</div>
        <div class="pid" v-for="pid of pids" :key="pid"
          @click="currentPidView = pid; scroll(true)"
          :class="{active: currentPidView === pid}">
          {{ pid }}
        </div>
      </div>
      <sectionCmp v-if="isOpen" header="Logs" :noStyle="noStyle"
        :actions="[
          { icon: 'fas fa-list', label: `${countLine}`, small: true, hidden: !countLine, active: !mode, click: () => mode = '' },
          { icon: 'fas fa-bug', label: `${countDebug}`, small: true, hidden: !countDebug, active: mode === 'debug', click: () => mode = 'debug' },
          { label: `{} ${countJSON}`, small: true, hidden: !countJSON, active: mode === 'json', click: () => mode = 'json' },
          { icon: 'fas fa-chevron-down', click: () => scroll(true) },
          { icon: 'fas fa-trash', click: () => clear() },
        ]" class="terminal-container">
          <div class="terminal" ref="jsonsRef">
            <div class="line" :class="{
              simplifiedMode,
              stderr: line.source === 'stderr',
              separator: line.isSeparator != null,
              json: line.json != null && !simplifiedMode,
              debug: line.debug != null && !simplifiedMode,
              cmd: line.cmd != null && !simplifiedMode
            }" v-for="line of displayedLines" :key="line.id" >
              <Popover placement="bottom-start" appendTo="">
                <template #trigger>
                  <div v-html="line.msg" v-if="simplifiedMode"></div>
                  <div v-else-if="line.cmd != null" >
                    <h2 class="section-header">Command</h2>
                    <div class="section-content">
                      {{ line.msg }}
                    </div>
                  </div>
                  <div v-else-if="line.debug  != null" >
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
                  <div v-else-if="line.json != null"  >
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
                </template>
                <template #content>
                  <h3>
                    Type:
                    <template v-if="line.debug">Debug</template>
                    <template v-else-if="line.json">JSON</template>
                    <template v-else-if="line.cmd">Command</template>
                    <template v-else>Text</template>
                  </h3>
                  <div class="more-info-container">
                    <div class="more-info-label">Raw message:</div>
                    <div class="more-info-content"><pre>{{ line.msg }}</pre></div>
                  </div>
                  <div class="more-info-container" v-if="line.pid" @click="line.pid ? currentPidView = line.pid : ''">
                    <div class="more-info-label">Issued from pid:</div>
                    <div class="more-info-content">{{ line.pid }}</div>
                  </div>
                  <div class="more-info-container">
                    <div class="more-info-label">Emitted date:</div>
                    <div class="more-info-content">{{ dayjs(line.timestamp).format('YYYY-MM-DD HH:mm:ss') }}</div>
                  </div>
                  <div v-if="line.cmd" class="more-info-container">
                    <div class="more-info-label">Options:</div>
                    <div class="more-info-content">
                      <JsonTreeView :maxDepth="1" :data="transformerJSON(line.cmd)" :copyable="true" :expand-depth="1" :show-double-quotes="true"/>
                    </div>
                  </div>
                </template>
              </Popover>
            </div>
          </div>

          <div class="input-container-terminal">
            <div class="histories" v-if="histories?.length">
              <div 
                class="history" :class="{active: history.active}" 
                v-for="(history, i) of histories" :key="i + 'history'">
                <div>
                  {{ history.raw }}
                </div>
                <div class="right">
                  <div>Used: {{history.timestamps?.length || 0}}</div>
                  <div>Last used: {{history.timestamp ? dayjs(history.timestamp).format('YYYY-MM-DD HH:mm:ss'): '???'}}</div>
                </div>
              </div>
            </div>
            <textarea v-model="messageToSend" @keypress.enter="sendEnter" @keyup="keyup" :placeholder="currentPidView ? `Send command to ${currentPidView}...` : 'Send new command...'"
              @input="inputTerminal"></textarea>
            <button @click="send"><i class="fas fa-envelope"></i></button>
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
import Popover from '@/components/Popover.vue';
import dayjs from 'dayjs'

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
/** @type {import('vue').Ref<{active: boolean, cmd: string, args: string, raw: string, timestamp: number,timestamps: number[]}[]>} */
const histories = ref([])

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
    return logs.value
      .filter((line) => {
        if(line.isSeparator) return true
        if(line.debug && isLineIncluded(line)) return true
        return false
      })
      .slice(-numberToDisplay.value)
  } else if(mode.value === 'json') {
    return logs.value
      .filter(line => {
        if(line.isSeparator) return true
        if(line.json && !line.debug && isLineIncluded(line)) return true
        return false
      })
      .slice(-numberToDisplay.value)
  } 
  return logs.value
    .filter((line) => {
      if(line.isSeparator) return true
      if(isLineIncluded(line)) return true
      return false
      
    })
    .slice(-numberToDisplay.value)
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
  if(currentPidView.value && currentPidView.value !== line.pid) return false  
  if (!message) return true
  const filters = message.includes(' | ')
    ? message.split(' | ')
    : [message]
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
  Socket.socket.on('logs:update', (/** @type {LogMessage[]}*/datas) => {
    datas.forEach(data=> {
      if (data.label !== props.service.label) return
      logs.value.push(data)
      scroll()
    })
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

const messageToSend = ref('')
/** @param {Event} ev */
async function send(ev) {
  const active = histories.value.find(a => a.active)
  if(active) {
    setTimeout(() => {
      messageToSend.value = active.raw?.trim()
      setTimeout(() => {
        histories.value = []
      },100);
    });
    
    return
  }
  if (messageToSend.value.trim()) {
    scroll(true)
    await props.service.sendTerminalPrompt({message: messageToSend.value, pid: currentPidView.value || undefined})
    //!.....Send
    if(ev.target) {
      /**@type {HTMLElement}*/(ev.target).style.height = 'calc(1em + 15px)';
      /**@type {HTMLElement}*/(ev.target).style.height = /**@type {HTMLElement}*/(ev.target).scrollHeight + 'px'
    }
    messageToSend.value = ''
  }
}
/** @param {KeyboardEvent} ev */
async function sendEnter(ev) {
  if (!ev.ctrlKey) await send(ev)
  else messageToSend.value += '\n'
}
/** @param {Event} ev */
async function inputTerminal(ev) {
  if(ev.target) {
    if(/**@type {HTMLElement}*/(ev.target).scrollHeight < 300) {
      /**@type {HTMLElement}*/(ev.target).style.height = 'calc(1em + 15px)';
      /**@type {HTMLElement}*/(ev.target).style.height = /**@type {HTMLElement}*/(ev.target).scrollHeight + 'px'
    }
  }
}

/** @param {KeyboardEvent} $event */
async function keyup($event) {
  if($event.code ==='ArrowUp') changeActive($event, 1)
  else if($event.code ==='ArrowDown') changeActive($event, -1)
  else histories.value = await props.service.autocomplete(messageToSend.value)
}

/**
 * @param {KeyboardEvent} $event
 * @param {number} offset
 */
async function changeActive($event, offset) {
  const activeIndex = histories.value.findIndex(a => a.active)
  if(activeIndex === -1) {
    const last = offset > 0 ? histories.value[histories.value.length - 1] : histories.value[0]
    if(last) last.active = true
  } else {
    const current = histories.value[activeIndex]
    const next = histories.value[activeIndex - offset]
    current.active = false
    if(next) next.active = true
    else changeActive($event, offset)
  }
}
/** @type {import('vue').Ref<number | null>} */
const currentPidView = ref(null)
const pids = computed(() => logs.value.reduce((aggr, log) => {
  if(log.pid && !aggr?.includes(log.pid)) aggr.push(log.pid)
  return aggr
}, /**@type {number[]}*/([])))
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
.terminal-container {
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
  flex-direction: column;
  .pids-container {
    display: flex;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
    .pid {
      padding: 5px 10px;
      border-bottom: 2px solid transparent;
      &.active {
        border-bottom-color:#0076bc
      }
    }
  }

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
  flex-grow: 1;
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
    &.cmd {
      padding: 0;
      margin: 10px 0;
      border: none;
      .section-header {
        background-color: #0076bc;
      }
      .section-content {
        border-color: #0076bc
      }
    }
    &.separator {
      border-left: none;
      margin: 20px auto;
      display: inline-block;
      width: max-content;
      font-weight: bold;
    }
    &.stderr {
      border-left-color: red;
      .section-header {
        background-color: red;
      }
      .section-content {
        border-color: red
      }
    }
    
  }
}

.input-container-terminal {
  display: flex;
  align-items: center;
  position: relative;
  gap: 10px;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  background: white;
  width: calc(100% - 10px);
  margin: auto;
  margin-bottom: 5px;
  margin-top: 20px;
  textarea {
    outline: none;
    height: max-content;
    height: calc(1em + 15px);
    flex-grow: 1;
    border: none;
  }
}

.more-info-container {
  display: flex;
  flex-direction: column;
  border-left: 2px solid #0076bc;
  padding-left: 10px;
  box-sizing: border-box;
  margin-bottom: 20px;
  border-radius: 5px;
  pre {
    margin: 0;
  }
  .more-info-label {
    font-weight: bold;
  }
  .more-info-content {
    background-color: #efefef;
    border: 1px solid #d2d2d2;
    border-radius: 5px;
    padding: 5px;
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
  div.value-key {
    white-space: normal;
    padding: 0;
    display: flex;
    .value-key {
      padding: 0;
      &+span {
        overflow: hidden;
        white-space: normal;
        width: max-content;
        display: inline-block;
        overflow: auto;
        width: 100%;
      }
    }
  }
  .data-key {
    .chevron-arrow {
      margin-right: 8px;
    }

  }
}

.histories {
  position: absolute;
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 100%;
  left: 0;
  bottom: calc(100% + 10px);
  z-index: 111;
  box-shadow: 0 0 12px 6px rgba(0,0,0,0.2);
  border-radius: 10px;
  .history {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid lightgrey;
    .right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
    }
    &.active {
      background-color: rgba(0,0,0,0.1);
    }
  }
}
</style>

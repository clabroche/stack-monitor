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
        <Popover appendTo="parent">
          <template #trigger>
            <div class="pid" :class="{active: currentPidView}" >
              Commands {{ currentPidView?.raw ? `: ${currentPidView?.raw?.substring(0, 20)}...` : ''}}
              <i class="fas fa-chevron-down"></i>
            </div>
          </template>
          <template #content>
            <div class="pids">
              <div v-for="pid of pids.slice().reverse().filter(a => a.raw?.trim())" :key="pid.pid" class="pid"
                @click="currentPidView = pid; scroll(true)"
                :class="{active: currentPidView?.pid === pid.pid}">
                {{ pid.raw }}
              </div>
            </div>
          </template>
        </Popover>
      </div>
      <sectionCmp v-if="isOpen" header="Logs" :noStyle="noStyle"
        :actions="[
          { icon: 'fas fa-list', label: `${countLine}`, small: true, hidden: !countLine, active: !mode, click: () => mode = '' },
          { icon: 'fas fa-bug', label: `${countDebug}`, small: true, hidden: !countDebug, active: mode === 'debug', click: () => mode = 'debug' },
          { label: `{} ${countJSON}`, small: true, hidden: !countJSON, active: mode === 'json', click: () => mode = 'json' },
          { icon: 'fas fa-chevron-down', click: () => scroll(true) },
          { icon: 'fas fa-trash', click: () => clear() },
        ]" class="terminal-container">
          <Transition name="slide-fade">
          <div class="terminal-panel" v-if="selectedLine">
            <div class="terminal-panel-bg" @click="selectedLine = null"></div>
            <div class="terminal-panel-content">
              <h3>
                Type:
                <template v-if="selectedLine.debug">Debug</template>
                <template v-else-if="selectedLine.json">JSON</template>
                <template v-else-if="selectedLine.cmd">Command</template>
                <template v-else>Text</template>
              </h3>
              <div class="more-info-container">
                <div class="more-info-label">Raw message:</div>
                <div class="more-info-content"><pre>{{ selectedLine.msg }}</pre></div>
              </div>
              <div class="more-info-container" v-if="selectedLine.pid" @click="setPid(selectedLine)">
                <div class="more-info-label">Issued from pid: </div>
                <div class="more-info-content">
                  {{ selectedLine.pid }}
                  <button class="small"><i class="fas fa-chevron-right"></i></button>
                </div>
              </div>
              <div class="more-info-container">
                <div class="more-info-label">Emitted date:</div>
                <div class="more-info-content">{{ dayjs(selectedLine.timestamp).format('YYYY-MM-DD HH:mm:ss') }}</div>
              </div>
              <div v-if="selectedLine.cmd" class="more-info-container">
                <div class="more-info-label">Options:</div>
                <div class="more-info-content">
                  <JsonTreeView :maxDepth="1" :data="transformerJSON(selectedLine.cmd)" :copyable="true" :expand-depth="1" :show-double-quotes="true"/>
                </div>
              </div>
            </div> 
          </div>
          </Transition>
          <div class="terminal" ref="jsonsRef">
            <div class="line" :class="{
              simplifiedMode,
              stderr: line.source === 'stderr' || (line.cmd && line.cmd.status === 'error'),
              success: (line.cmd && line.cmd.status === 'exited'),
              separator: line.isSeparator != null,
              json: line.json != null && !simplifiedMode,
              debug: line.debug != null && !simplifiedMode,
              cmd: line.cmd != null && !simplifiedMode,
              prompt: line.prompt && !simplifiedMode,
            }" v-for="line of displayedLines" :key="line.id" @click="setSelectedLine(line)" >
                  <div v-html="line.msg" v-if="simplifiedMode"></div>
                  <div v-else-if="line.cmd != null" >
                    <template v-if="line.cmd.cmd.trim()">
                      <h2 class="section-header" v-if="line.cmd.cmd.trim()">
                        Command
                        <template v-if="line.cmd.status === 'running'"><Spinner style="display: inline-flex;" :no-color="true" size="20"></Spinner></template>
                      </h2>
                      <div class="section-content">
                        {{ line.msg }} 
                      </div>
                    </template>
                    <template v-else>
                      <br/>
                    </template>
                  </div>
                  <div v-else-if="line.prompt">
                    <h2 class="section-header">Prompt</h2>
                    <div class="section-content" v-html="line.msg.trim() || '<br/>'"/>
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
            </div>
          </div>

          <div class="input-container-terminal" v-if="!currentPidView || currentPidView.cmd?.status == 'running'">
            <div class="histories" v-if="histories?.length">
              <div 
                class="history" :class="{active: history.active}" 
                @click="messageToSend = history.raw; histories = []; textareaRef?.focus()"
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
            <div class="histories" v-else-if="autocompleteInProgress">
              <div class="history">
                <Spinner size="20"></Spinner>
              </div>
            </div>
            <div class="bar-terminal">
              <div class="left">
                <div class="blue">
                  <i class="icon fas fa-folder"></i>
                  <label>{{ getShortPath(service.rootPath) }}</label>
                </div>
                <div :class="gitChanges?.length ? 'yellow': 'green'" v-if="currentBranch">
                  <i class="icon fas fa-code-branch"></i>
                  <label>
                    {{ currentBranch }}
                    <div v-if="+gitRemoteDelta > 0"><i class="fas fa-long-arrow-alt-up"></i>{{ +gitRemoteDelta }}</div>
                    <div v-if="+gitRemoteDelta < 0"><i class="fas fa-long-arrow-alt-down"></i>{{ Math.abs(+gitRemoteDelta) }}</div>
                  </label>
                </div>
              </div>
              <div class="right">
              </div>
            </div>
            <div class="input-content-terminal">
              <div class="badge" v-if="currentPidView?.pid">Pid: {{ currentPidView.pid }}</div>
              <i class="fas fa-chevron-right"></i>
              <PassThrough>
                <textarea ref="textareaRef"
                  v-model="messageToSend"
                  @keypress.enter="sendEnter"
                  @keyup="keyup"
                  @input="inputTerminal"
                  :placeholder="currentPidView ? `Send command to ${currentPidView.pid}...` : 'Send new command...'"
                />
              </PassThrough>
              <!-- <button @click="send"><i class="fas fa-envelope"></i></button> -->
            </div>
          </div>
          <div class="input-container-terminal" v-else-if="currentPidView">
            Your command no longer accepts further response 
            <button @click="currentPidView = null">Go to all processes view</button>
            <button class="danger" @click="sendTerminate(true)">Or try to force kill</button>
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
import { computed, onMounted, ref, nextTick, onBeforeUnmount } from 'vue';
import Modal from '@/components/Modal.vue'
import Service from '@/models/service'
import notification from '@/helpers/notification';
import Popover from '@/components/Popover.vue';
import dayjs from 'dayjs'
import fs from '@/models/fs';
import { debounce } from 'debounce';
import Spinner from '@/components/Spinner.vue';
import PassThrough from './PassThrough.vue';

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
/** @type {import('vue').Ref<LogMessage | null>} */
const selectedLine = ref(null)
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
  /** @type {LogMessage[]} */
  let lines = []
  if(mode.value === 'debug') {
    lines = logs.value
      .filter((line, i, arr) => {
        if(line.isSeparator) return isLineIncluded(line, arr[i + 1])
        if(line.debug && isLineIncluded(line, arr[i + 1])) return true
        return false
      })
      .slice(-numberToDisplay.value)
  } else if(mode.value === 'json') {
    lines = logs.value
      .filter((line, i, arr) => {
        if(line.isSeparator) return isLineIncluded(line, arr[i + 1])
        if(line.json && !line.debug && isLineIncluded(line, arr[i + 1])) return true
        return false
      })
      .slice(-numberToDisplay.value)
  } else {
    lines = logs.value
      .filter((line, i, arr) => {
        if(line.isSeparator) return isLineIncluded(line, arr[i + 1])
        if(isLineIncluded(line, arr[i + 1])) return true
        return false
        
      })
      .slice(-numberToDisplay.value)
  }
    
  return lines.filter((line, i, arr) => {
    if(line.isSeparator) return !arr[i+1]?.isSeparator
    return true
  })
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

/**
 * @param {LogMessage} line
 * @param {LogMessage | undefined} nextLine
 */
const isLineIncluded = (line, nextLine) => {
  const message = filterSearch.value
  if(line.isSeparator) return true
  if(currentPidView.value?.pid && currentPidView.value?.pid !== line.pid) return false  
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

  Socket.socket.on('logs:update:lines', (/** @type {LogMessage[]}*/lines) => {
    lines.forEach(line=> {
      if (line.label !== props.service.label) return
      const index = logs.value.findIndex(a => a.id === line.id)
      if(index >= 0) {
        logs.value.splice(index, 1, line)
      }
    })
  })

  Socket.socket.on('service:exit', (/** @type {{label:string, code: number, signal: string, pid?: number}}*/data) => {
    if (data.label !== props.service.label) return
    if(data.pid) {
      if(currentPidView.value?.pid === data.pid) {
        currentPidView.value = null
        scroll(true)
      }
    }
  })

  Socket.socket.on('service:crash', (/** @type {{label:string, code: number, signal: string, pid?: number}}*/data) => {
    if (data.label !== props.service.label) return
    if(data.pid) {
      if(currentPidView.value?.pid === data.pid) {
        currentPidView.value = null
        scroll(true)
      }
    }
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
  ev.preventDefault()
  const pid = await props.service.sendTerminalPrompt({
    message: messageToSend.value.trim(),
    pid: currentPidView.value?.pid || undefined
  })
  if(messageToSend.value.trim()) {
    setTimeout(() => {
      const lineFound = logs.value.find((log) => log.pid === pid.pid)
      if(lineFound?.cmd?.status === 'running') {
        currentPidView.value = lineFound
      }
    }, 100);
  }
  messageToSend.value = ''
  if(ev.target) {
    await nextTick()
    rerenderTextarea()
  }
  scroll(true)
  reloadBarInfos(true)
}

const textareaRef = ref()
function rerenderTextarea() {
  textareaRef.value.style.height = 'calc(15px)';
  textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
}
/** @param {KeyboardEvent} ev */
async function sendEnter(ev) {
  const active = histories.value.find(a => a.active)
  if(active) {
    setTimeout(async () => {
      messageToSend.value = active.raw?.trim()
      await nextTick()
      rerenderTextarea()
      setTimeout(() => {
        histories.value = []
      },100);
    });
    return
  }
  if (!ev.ctrlKey) await send(ev)
  else messageToSend.value += '\n'
}
/** @param {Event} ev */
async function inputTerminal(ev) {
  histories.value = []
  if(ev.target) {
    if(/**@type {HTMLElement}*/(ev.target).scrollHeight < 300) {
      rerenderTextarea()
    }
  }
}

/** @param {boolean} forceKill*/
async function sendTerminate(forceKill = false) {
  await props.service.sendTerminalTerminate({pid: currentPidView.value?.pid || undefined, forceKill})
}
const autocompleteInProgress = ref(false)
/** @param {KeyboardEvent} $event */
async function keyup($event) {
  if($event.code === 'Escape') return histories.value = []
  if($event.code === 'Enter') return histories.value = []
  if($event.ctrlKey && $event.code === 'KeyC') return sendTerminate()
  if($event.code !=='ArrowUp' && $event.code !=='ArrowDown' && !messageToSend.value) return histories.value = []
  if($event.code ==='ArrowUp' && histories.value.length) return changeActive($event, 1)
  if($event.code ==='ArrowDown' && histories.value.length) return changeActive($event, -1)
  if(['ArrowUp', 'ArrowDown'].includes($event.code)) return histories.value = await props.service.autocomplete(messageToSend.value, {force: true})
  autocompleteInProgress.value = true
  await autocomplete()
  if(!messageToSend.value) changeActive($event, 1)
}
const autocomplete = debounce(async (force = false) => {
  try {
    autocompleteInProgress.value = true
    const _histories = await props.service.autocomplete(messageToSend.value, {force})
    if(!messageToSend.value && !force) return 
    histories.value = _histories
  } finally {
    autocompleteInProgress.value = false
  }
}, 200)

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
/** @type {import('vue').Ref<LogMessage | null | undefined>} */
const currentPidView = ref(null)
const pids = computed(() => logs.value.reduce((aggr, log) => {
  if(log.pid && !aggr?.find(_log => _log.pid === log.pid)) aggr.push(log)
  return aggr
}, /**@type {LogMessage[]}*/([])))

const currentBranch = ref('')
const gitChanges = ref('')
const homedir = ref('')
const gitRemoteDelta = ref('')
const interval = setInterval(() => {
  reloadBarInfos()
}, 1000);
const longInterval = setInterval(() => {
  reloadBarInfos(true)
}, 20000);
onBeforeUnmount(() => {
  clearInterval(interval)
  clearInterval(longInterval)
})
onMounted(async () => {
  homedir.value = await fs.homeDir()
  reloadBarInfos(true)
})

const reloadBarInfos = debounce(async(reloadCostingInfos = false) => {
  gitChanges.value = await props.service.getStatus()
  currentBranch.value = await props.service.getCurrentBranch()
  if(reloadCostingInfos) {
    gitRemoteDelta.value = await props.service.gitRemoteDelta(currentBranch.value)
  }
}, 100)

/**
 * 
 * @param {string | undefined} path 
 */
function getShortPath(path) {
  return path
    ?.replace(homedir.value, '~')
}

/** @type {import('vue').Ref<InstanceType<typeof Popover>[]>}*/
const popoversRef = ref([])
/**
 * @param {LogMessage | undefined | null} line 
 */
function setPid(line) {
  const command = logs.value.find(l => l.cmd && l.pid === line?.pid)
  currentPidView.value = command || null
  hidePopovers()
}

function hidePopovers() {
  popoversRef.value?.forEach(popover => {
    popover?.tippyInstance?.hide()
  });
}

function setSelectedLine(line) {
  if (window.getSelection().toString()) return
  selectedLine.value = line
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
.terminal-container {
  width: 100%;
  margin: auto;
  height: calc(100vh - 400px - 40px);
  position: relative;
  @media (max-width: 1300px) { 
    height: calc(100vh - 500px - 40px);
  }
  @media (max-width: 800px) { 
    height: calc(100vh - 650px - 40px);
  }
  box-sizing: border-box;
  .terminal-panel {
    position: absolute;
    z-index: 2;
    right: 0;
    top: 0;
    width: 100%;
    height: 100%;
    .terminal-panel-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      left: 0;
      top: 0;
    }
    .terminal-panel-content {
      max-width: calc(100% - 40px);
      background-color: white;
      z-index: 2;
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
  }
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
    .pids {
      max-height: 400px;
      overflow: auto;
      .pid {
        &:hover {
          background-color: rgba(0,0,0,0.05);
          cursor: pointer;
        }
        &.active {
          border-left-color: #0076bc;
          border-bottom-color: transparent;
        }
      }
    }
    .pid {
      padding: 5px 10px;
      border: 2px solid transparent;
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
    white-space: pre-wrap;
    width: 100%;
    box-sizing: border-box;
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
      width: max-content;
      padding: 0 10px;
      background-color: #000000;
      color: white;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }
    .section-content {
      border-left: 4px solid #000000;
      border-bottom-left-radius: 4px;
      padding: 0 10px;
      box-sizing: border-box;
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
    &.prompt {
      padding: 0;
      margin: 10px 0;
      border: none;
      align-self: flex-end;
      margin-right: 10px;
      .section-header {
        background-color: #5800bc;
        margin-left: auto;
      }
      .section-content {
        border-left: none;
        text-align: right;
        border-right: 4px solid #5800bc;
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
      border-left-color: #ac1010;
      .section-header {
        background-color: #ac1010;
      }
      .section-content {
        border-color: #ac1010
      }
    }
    &.success {
      border-left-color: #0c9913;
      .section-header {
        background-color: #0c9913;
      }
      .section-content {
        border-color: #0c9913
      }
    }
    
  }
}

.input-container-terminal {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  background: white;
  width: calc(100% - 10px);
  margin: auto;
  margin-bottom: 5px;
  margin-top: 20px;
  .bar-terminal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    .left,.right {
      display: flex;
      flex-wrap: wrap;
      gap: 1px;
      &.right{
        justify-content: flex-end;
      }
      &> div {
        padding: 2px 5px;
        margin-right: 12px;
        box-sizing: border-box;
        position: relative;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        white-space: nowrap;
        label {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        &.red {
          background-color: #da0606;
          &::before {background-color: #da0606;}
          &::after {border-color: #da0606;}
        }
        &.white {
          background-color: lightgrey;
          color: black;
          &::before {background-color: lightgrey;}
          &::after {border-color: lightgrey;}
        }
        &.yellow {
          background-color: #bca900;
          &::before {background-color: #bca900;}
          &::after {border-color: #bca900;}
        }
        &.blue {
          background-color: #0076bc;
          &::before {background-color: #0076bc;}
          &::after {border-color: #0076bc;}
        }
        &.green {
          background-color: #00bc55;
          &::before {background-color: #00bc55;}
          &::after {border-color: #00bc55;}
        }
        &::after {
          content: '';
          border: 12px solid transparent;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
          border-right-color: transparent !important;
          border-right: none;
          width: 0px;
          height: 100%;
          box-sizing: border-box;
          position: absolute;
          left: 100%;
          z-index: 1;
          top: 0;
        }
        &::before {
          content: '';
          width: 12px;
          height: 100%;
          box-sizing: border-box;
          position: absolute;
          right: 100%;
          background-color: attr(color);
          top: 0;
        }
      }
    }
  }
  .input-content-terminal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
  }
  textarea {
    outline: none;
    height: max-content;
    height: calc(19px);
    margin-top: 5px;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    button {
      width: max-content;
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
    padding: 2px 10px;
    border-bottom: 1px solid lightgrey;
    &:hover {
      background-color: rgba(0,0,0,0.05);
      cursor: pointer;
    }
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
.badge {
  border-radius: 1000px;
  background-color: grey;
  color: white;
  padding: 0 10px;
  box-shadow: 0 0 10px 0px rgba(0,0,0,0.4);
}

.slide-fade-enter-active{
  transition: all 0.2s ease-out;
  &>* {
    transition: all 0.2s ease-out;
  }
}

.slide-fade-leave-active{
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  &>* {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  }
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  overflow: hidden;
  .terminal-panel-content {
    transform: translateX(100%);
  }
  .terminal-panel-bg {
    opacity: 0;
  }
}
</style>

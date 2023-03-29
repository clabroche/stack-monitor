<template>
  <div header="Logs" @is-open="isOpen = $event" :defaultIsOpen="isOpen" v-if="service.enabled"
    :style="{ maxHeight: isInMultiMode ? '400px' : 'inherit' }"
  >
    <div class="header">
      <div class="input-container">
        <i class="fas fa-search"></i>
        <input type="text" v-model="search" placeholder="Search..." @keypress.enter="nextSearch">
        <div>
          <button @click="previousSearch"><i class="fas fa-chevron-up"></i></button>
          <button @click="nextSearch"><i class="fas fa-chevron-down"></i></button>
        </div>
      </div>
      <div class="separator"></div>
      <div class="input-container">
        <i class="fas fa-times"></i>
        <input
          type="text" v-model="filterSearch"
          :placeholder="isInclude ? 'Include...' : 'Exclude...'"
          @keypress.enter="nextSearch">
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
    </div>
    <div class="main-content">
      <section-cmp v-if="isOpen" header="Logs" :noStyle="noStyle"
        :actions="[{ icon: 'fas fa-chevron-down', click: () => scrollTerminal() }, { icon: 'fas fa-trash', click: () => clear() }]">
          <div v-if="service" class="logs-container" ref="logsContainer" id="terminal" style="box-sizing: content-box">
        </div>
        <transition name="appear">
          <section-cmp v-if="isOpen && jsonContainerOpen" :header="'Objects: (' + jsonsToDisplay.length + ')'" :noStyle="true" class="right json-container" style="background-color: white; border: none">
            <div class="jsons-header input-container">
              <input type="text" placeholder="Ex: src.result[0]" v-model="jsonPathSearch">
            </div>
            <div class="jsons" ref="jsonsRef">
              <div v-for="json of jsonsToDisplay" :key="json">
                <json-viewer :value="json" :copyable="true" :expand-depth="1" :show-double-quotes="true">
                  <template #copy="{ copied }">
                    <div v-if="copied">Copied</div>
                    <div v-else>Copy</div>
                    <router-link :to="{ name: 'JSONFormatter', query: { json: JSON.stringify(json) } }">
                      Open in json-viewer
                    </router-link>
                    <div @click.stop="findSolution(json)">
                      Find a solution
                    </div>
                  </template>
                </json-viewer>
              </div>
            </div>
          </section-cmp>
        </transition>
        <transition name="appear">
          <section-cmp v-if="isOpen && jsonSMContainerOpen" :header="'Debug Objects: (' + jsonsSMToDisplay.length + ')'" :noStyle="true" class="right json-container" style="background-color: white; border: none">
            <div class="jsons-header input-container">
              <input type="text" placeholder="Ex: src.result[0]" v-model="jsonPathSearch">
            </div>
            <div class="jsons" ref="jsonsRef">
              <div v-for="json of jsonsSMToDisplay" :key="json">
                <json-viewer :value="json" :copyable="true" :expand-depth="1" :show-double-quotes="true">
                  <template #copy="{ copied }">
                    <div v-if="copied">Copied</div>
                    <div v-else>Copy</div>
                    <router-link :to="{ name: 'JSONFormatter', query: { json: JSON.stringify(json) } }">
                      Open in json-viewer
                    </router-link>
                    <div @click.stop="findSolution(json)">
                      Find a solution
                    </div>
                  </template>
                </json-viewer>
              </div>
            </div>
          </section-cmp>
        </transition>
      </section-cmp>
      
      <div class="open-buttons">
          <button v-for="(toggle, i) of toggles" :key="toggle.label" @click="toggleIsOpen(i)" :class="{ bordered: toggle.isOpen }">
            <span style="font-weight: bold;">{{toggle.label}} ({{ toggle?.jsons?.length }})</span>
          </button>
      </div>
    </div>
  </div>
  <section-cmp v-else>
    <div class="not-launch">
      <i class="fas fa-ban"></i>
      Lancer le service pour voir les logs
    </div>
  </section-cmp>


  <modal ref="findSolutionModal" cancelString="No" validateString="Yes">
    <template #header>
      Find solution from AI
    </template>
    <template #body="{data: tokens}">
      Are you sure ? This have a cost of ~{{ tokens.price }}$
    </template>
  </modal>

  <modal ref="findSolutionResultModal" cancelString="OK" :noValidate="true">
    <template #header>
      Find solution from AI
    </template>
    <template #body="{data: result}">
      <pre>
        {{result?.trim()}}
      </pre>
    </template>
  </modal>
</template>

<script setup>
import Socket from '@/helpers/socket';
// @ts-ignore
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import sectionCmp from '@/components/Section.vue';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { CanvasAddon } from 'xterm-addon-canvas';
import debounce from 'debounce'
import JsonViewer from 'vue-json-viewer'
import jsonpath from 'jsonpath'
import 'vue-json-viewer/style.css'
import { computed, onMounted, ref, watch, watchEffect } from '@vue/runtime-core';
import router from '@/router/router';
import Modal from '@/components/Modal.vue'
import Service from '@/models/service'
const props = defineProps({
  service: { default: null },
  noStyle: { default: false },
  isInMultiMode: {default: false}
})
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const terminal = ref(null)
const terminalSearch = ref(null)
const logsContainer = ref(null)
const jsonsRef = ref(null)
const filterSearch = ref('')
const jsonPathSearch = ref('')
const jsons = ref([])
const isOpen = ref(true)
const isInclude = ref(false)
const logs = ref('')
const json = ref('')
const findSolutionModal = ref()
const findSolutionResultModal = ref()
const lineToKeep = ref(router.currentRoute.value.query.lineToKeep || 120)
watchEffect(() => {
  lineToKeep.value = router.currentRoute.value.query.lineToKeep || 120
})

async function findSolution(data) {
  const tokens = await Service.getTokens(JSON.stringify(data))
  const res = await findSolutionModal.value.open(tokens).promise
  if (res) {
    const review = await Service.findSolutionFromAi(JSON.stringify(data))
    const res = await findSolutionResultModal.value.open(review).promise
  }
}

watch(() => props.service?.enabled, async() => {
  if(props.service?.enabled && !terminal.value) {
    createTerminal()
  } else if(props.service?.enabled) {
    await new Promise(resolve => setTimeout(resolve, 10));
    terminal.value.open(logsContainer.value);
  }
})
const search = ref('')

const jsonContainerOpen = ref(false)
const jsonSMContainerOpen = ref(false)



watch(() => search.value, () => {
  if (terminalSearch.value) {
    terminalSearch.value.findNext(search.value)
  }
})
watch(() => `${isInclude.value}|${filterSearch.value}`, () => filter())
watch(() => isOpen.value, () => createTerminal()) 
const isLineFiltered=(line) => {
  const message = filterSearch.value
  if (!message) return true
  const filters = message.includes(' | ')
    ? message.split(' | ')
    : [message]
  return filters.filter(a => a).every((filter => {
    const res = line.toUpperCase().match(new RegExp(escapeRegExp(filter), 'gi'))
    return isInclude.value ? res : !res
  }))
}
const toggleIsOpen = (val) => {
  const shouldOpen = !toggles.value[val].isOpen
  toggles.value.forEach(t => t.isOpen = false)
  toggles.value[val].isOpen = shouldOpen
  setTimeout(() => scroll(true), 0);
}
const filterWithoutDebounce = function (message) {
  terminal.value.clear()
  jsons.value = []
  const lines = logs.value
    ?.split('\n')
    ?.filter(isLineFiltered)
    ?.map(line => {
      write(line)
      return line
    });
  scroll()
  return lines
}
const filter = debounce(filterWithoutDebounce, 300)

onMounted(() => createTerminal())
async function createTerminal() {
  await new Promise(resolve => setTimeout(resolve, 10));
  if(!logsContainer.value) return
  if (!isOpen.value) return
  terminal.value = new Terminal({
    smoothScrollDuration: 100,
    experimentalCarAtlas: 'static',
    fontFamily: 'MesloLGS NF, monospace',
    convertEol: true,
    disableStdin: true,
    fontSize: 13,
    allowTransparency: true,
    minimumContrastRatio: 7,
    theme: {
      background: '#ffffff00',
      foreground: '#4c4c4c',
      selectionBackground: '#1d95db',
      selectionForeground: 'white'
    }
  });
  const fitAddon = new FitAddon();
  terminal.value.attachCustomKeyEventHandler((arg) => {
    if (arg.ctrlKey && arg.code === "KeyC" && arg.type === "keydown") {
      const selection = terminal.value.getSelection();
      if (selection) {
        navigator?.clipboard?.writeText(selection)
        return false;
      }
    }
    return true;
  });
  terminal.value.loadAddon(fitAddon);
  terminal.value.loadAddon(new WebLinksAddon());
  terminal.value.loadAddon(new CanvasAddon());

  terminal.value.open(logsContainer.value);
  const searchAddon = new SearchAddon();
  terminalSearch.value = searchAddon
  terminal.value.loadAddon(searchAddon);
  fitAddon.activate(terminal.value)
  fitAddon.fit();
  setTimeout(() => {
    fitAddon.fit();
  }, 100);
  window.onresize = function () {
    fitAddon.fit();
  }
  logs.value = await props.service.getLogs()
  logs.value.split('\n').map(line => write(line))
  Socket.on('logs:update', data => {
    if (data.label !== props.service.label || !data.msg) return
    data.msg.trim().split('\n').filter(a => a).map(line => {
      write(line)
      logs.value += line
      scroll()
    })
  })
  Socket.on('logs:clear', data => {
    if (data.label !== props.service.label) return
    terminal.value.clear()
  })
}

const jsonsToDisplay = computed(() => {
  scroll()
  return jsonPathSearch.value ?
    jsons.value.map(json => {
      try {
        const res = jsonpath.query(json, jsonPathSearch.value)
        if (res.length === 1) return res['0']
        else return res
      } catch (error) {
        console.error(error)
      }
    })
    : jsons.value
})
function scrollTerminal() {
  if (terminal) {
    // @ts-ignore
    terminal.value.scrollToBottom()
    scroll(true)
  }
}
const jsonsSMToDisplay = computed(() => {
  scroll()
  const filteredJSON = jsons.value
    .filter(json => json?.[0] === 'stack-monitor')
    .map(j => j.length === 2  ? j[1] : j.slice(1))
  return jsonPathSearch.value ?
    filteredJSON.map(json => {
      try {
        const res = jsonpath.query(json, jsonPathSearch.value)
        if (res.length === 1) return res['0']
        else return res
      } catch (error) {
        console.error(error)
      }
    })
    : filteredJSON
})

const toggles = ref([
  { label: 'All', isOpen: jsonContainerOpen, jsons: jsonsToDisplay },
  { label: 'Debug', isOpen: jsonSMContainerOpen, jsons: jsonsSMToDisplay }
])

function write(line) {
  if(!isLineFiltered(line)) return
  try { line = JSON.parse(line) } catch (error) { }
  if (typeof line !== 'string') {
    terminal.value.writeln(JSON.stringify(line))
    jsons.value.push(line)
    jsons.value = jsons.value.slice(-lineToKeep.value)
  } else {
    terminal.value.writeln(line)
  }
}

async function clear() {
  terminal.value.clear()
  props.service.clear()
  logs.value = ''
  jsons.value = []
}
async function nextSearch(ev) {
  if (ev.shiftKey) {
    return previousSearch()
  }
  if (terminalSearch.value) {
    terminalSearch.value.findNext(search.value)
  }
}
async function previousSearch(ev) {
  if (terminalSearch.value) {
    terminalSearch.value.findPrevious(search.value)
  }
}
function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
async function scroll(force, customElement) {
  const container = customElement || jsonsRef.value
  if(!container) return
  const shouldScroll = container.scrollTop + container.clientHeight === container.scrollHeight
  await new Promise(res => setTimeout(res, 100))
  if (shouldScroll || force) container.scrollTop = container.scrollHeight
}
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
  &>.separator {
    border-left: 1px solid lightgrey;

  }
}
.logs-container, .json-container {
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
    align-items: center
  }
}

$jsonHeaderHeight: 10px;
$jsonHeadermargin: 10px;
.jsons-header {
  height: $jsonHeaderHeight;
  margin-bottom: $jsonHeadermargin;
  input {
    width: 100%;
  }

}
.jsons {
  overflow: auto;
  height: calc(100% - ($jsonHeaderHeight + $jsonHeadermargin));
}
.main-content .json-container {
  position: absolute;
  background: none;
  right: 3px;
  top: 0;
  width: calc(100% - 6px);
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
  margin: 0;
  z-index: 100;
}
.open-buttons {
  width: 140px;
  button {
    width: 100%;
  }
}

.appear-enter-active,
.appear-leave-active {
  transition:  .3s;
  transform-origin: right 
}
.appear-enter-from,
.appear-leave-to {
  opacity: 0
}
</style>

<style lang="scss">
@import '~xterm/css/xterm.css';

.xterm-decoration-top {
  background-color: orange;
  color: white;
}

.jv-container {
  background-color: transparent !important;
  .jv-code {
    padding: 10px 0;
    border-bottom: 1px solid lightgrey;
  }
}

</style>

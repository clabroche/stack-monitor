<template>
  <div header="Logs" @is-open="isOpen = $event" :defaultIsOpen="isOpen">
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
        :actions="[{ icon: 'fas fa-trash', click: () => clear() }]">
        <div v-if="service" class="logs-container" ref="logsContainer" id="terminal">
        </div>
      </section-cmp>
      <section-cmp v-if="isOpen && jsons?.length" :header="'Objects: (' + jsons.length +')'" :noStyle="noStyle" class="right">
        <div class="jsons-header input-container">
          <input type="text" placeholder="Ex: src.result[0]" v-model="jsonPathSearch">
        </div>
        <div class="jsons" ref="jsonsRef">
          <div v-for="json of jsonsToDisplay" :key="json">
            <json-viewer :value="json" :copyable="true" :expand-depth="1" :show-double-quotes="true" />
          </div>
        </div>
      </section-cmp>
    </div>
  </div>
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
import { computed, onMounted, ref, watch } from '@vue/runtime-core';
const props = defineProps({
  service: { default: null },
  noStyle: { default: false },
})

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
const search = ref('')


watch(() => search.value, () => {
  if (terminalSearch.value) {
    terminalSearch.value.findNext(search.value)
  }
})
watch(() => `${isInclude.value}|${filterSearch.value}`, () => filter(filterSearch.value))
watch(() => isOpen.value, () => createTerminal()) 
const filter = debounce(async function (message) {
  terminal.value.clear()
  jsons.value = []
  logs.value
    ?.split('\n')
    ?.filter(line => {
      if (!message) return true
      const filters = message.includes(' | ')
        ? message.split(' | ')
        : [message]
      return filters.filter(a => a).every((filter => {
        const res = line.toUpperCase().match(new RegExp(escapeRegExp(filter), 'gi'))
        return isInclude.value ? res : !res
      }))
    })
    ?.map(line => {
      write(line)
      return line
    }).join('\n');
  await scroll()
}, 100)

onMounted(() => createTerminal())
async function createTerminal() {
  await new Promise(resolve => setTimeout(resolve, 10));
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
  fitAddon.activate(terminal)
  fitAddon.fit();
  setTimeout(() => {
    fitAddon.fit();
  }, 100);
  window.onresize = function () {
    fitAddon.activate(terminal)
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
  if (logsContainer.value) {
    // @ts-ignore
    logsContainer.value.scrollTo({
      'behavior': 'smooth',
      'left': 0,
      // @ts-ignore
      'top': logsContainer.value.offsetHeight + 1000000
    });
  }
  setTimeout(async () => {
    await scroll(true)
  }, 100);
}

const jsonsToDisplay = computed(() => {
  scroll()
  return jsonPathSearch.value ?
    jsons.value.map(json => {
      const res = jsonpath.query(json, jsonPathSearch.value)
      if (res.length === 1) return res['0']
      else res
    })
    : jsons.value
})



function write(line) {
  try { line = JSON.parse(line) } catch (error) { }
  if (typeof line !== 'string') {
    terminal.value.writeln(JSON.stringify(line))
    jsons.value.push(line)
    jsons.value = jsons.value.slice(-40)
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
async function scroll(force) {
  const container = jsonsRef.value
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
.logs-container {
  width: 100%;
  margin: auto;
  height: 400px;
  // height: 1000px;
  box-sizing: border-box;
}

.input-container {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    border-radius: 10px;
    border: none;
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
    max-height: 500px;
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

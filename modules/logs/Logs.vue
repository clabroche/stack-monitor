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

<script>
import Stack from '@/models/stack'
import Socket from '@/helpers/socket';
// @ts-ignore
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import SectionVue from '@/components/Section.vue';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { CanvasAddon } from 'xterm-addon-canvas';
import debounce from 'debounce'
import JsonViewer from 'vue-json-viewer'
import jsonpath from 'jsonpath'
import 'vue-json-viewer/style.css'

export default {
  name: 'Logs',
  components: {
    sectionCmp: SectionVue,
    JsonViewer
  },
  props: {
    service: { default: null },
    noStyle: { default: false },
  },
  computed: {
    watchChangeFilter() {
      return `${this.isInclude}|${this.filterSearch}`;
    },
    jsonsToDisplay() {
      this.scroll()
      return this.jsonPathSearch ?
        this.jsons.map(json => {
          const res = jsonpath.query(json, this.jsonPathSearch)
          if(res.length === 1) return res['0']
          else res
        })
        : this.jsons
    }
  },
  watch: {
    async isOpen() {
      this.createTerminal()
    },
    search() {
      if (this.terminalSearch) {
        this.terminalSearch.findNext(this.search)
      }
    },
    watchChangeFilter() {
      this.filter(this.filterSearch)
    }
  },
  data() {
    return {
      terminal: null,
      /** @type {SearchAddon | null} */
      terminalSearch: null,
      Stack,
      filterSearch: '',
      jsonPathSearch: '',
      jsons: [],
      isOpen: true,
      isInclude: false,
      logs: '',
      json: '',
      search: '',
    }
  },
  async mounted() {
    this.createTerminal()
  },
  methods: {
    async createTerminal() {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (!this.isOpen) return
      const terminal = new Terminal({
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
      terminal.attachCustomKeyEventHandler((arg) => {
        if (arg.ctrlKey && arg.code === "KeyC" && arg.type === "keydown") {
          const selection = terminal.getSelection();
          if (selection) {
            navigator?.clipboard?.writeText(selection)
            return false;
          }
        }
        return true;
      });
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());
      terminal.loadAddon(new CanvasAddon());

      this.terminal = terminal
      terminal.open(this.$refs.logsContainer);
      const searchAddon = new SearchAddon();
      this.terminalSearch = searchAddon
      terminal.loadAddon(searchAddon);
      fitAddon.activate(terminal)
      fitAddon.fit();
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
      window.onresize = function () {
        fitAddon.activate(terminal)
        fitAddon.fit();
      }
      const logs = await this.service.getLogs()
      logs.split('\n').map(line => this.write(line))
      this.logs = logs
      Socket.on('logs:update', data => {
        if (data.label !== this.service.label || !data.msg) return
        data.msg.trim().split('\n').filter(a => a).map(line => {
          this.write(line)
          this.logs += line
          this.scroll()
        })
      })
      Socket.on('logs:clear', data => {
        if (data.label !== this.service.label) return
        terminal.clear()
      })
      if (this.$refs.logsContainer) {
        // @ts-ignore
        this.$refs.logsContainer.scrollTo({
          'behavior': 'smooth',
          'left': 0,
          // @ts-ignore
          'top': this.$refs.logsContainer.offsetHeight + 1000000
        });
      }
      setTimeout(async () => {
        await this.scroll(true)
      }, 100);
    },
    write(line) {
      try { line = JSON.parse(line) } catch (error) { }
      if (typeof line !== 'string') {
        this.terminal.writeln(JSON.stringify(line))
        this.jsons.push(line)
        this.jsons = this.jsons.slice(-40)
      } else {
        this.terminal.writeln(line)
      }
    },
    async clear() {
      this.terminal.clear()
      this.service.clear()
      this.logs = ''
      this.jsons = []
    },
    async nextSearch(ev) {
      if (ev.shiftKey) {
        return this.previousSearch()
      }
      if (this.terminalSearch) {
        this.terminalSearch.findNext(this.search)
      }
    },
    async previousSearch(ev) {
      if (this.terminalSearch) {
        this.terminalSearch.findPrevious(this.search)
      }
    },
    escapeRegExp(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    },
    async scroll(force) {
      const container = this.$refs.jsonsRef
      if(!container) return
      const shouldScroll = container.scrollTop + container.clientHeight === container.scrollHeight
      await new Promise(res => setTimeout(res, 100))
      if (shouldScroll || force) container.scrollTop = container.scrollHeight
    },
    filter: debounce(async function (message) {
      this.terminal.clear()
      this.jsons = []
      this.logs
        ?.split('\n')
        ?.filter(line => {
          if (!message) return true
          const filters = message.includes(' | ')
            ? message.split(' | ')
            : [message]
          return filters.filter(a => a).every((filter => {
            const res = line.toUpperCase().match(new RegExp(this.escapeRegExp(filter), 'gi'))
            return this.isInclude ? res : !res
          }))
        })
        ?.map(line => {
          this.write(line)
          return line
        }).join('\n');
        await this.scroll()
    }, 100)
  }
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

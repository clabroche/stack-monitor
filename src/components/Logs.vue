<template>
<div header="Logs" @is-open="isOpen = $event" :defaultIsOpen="isOpen">
  <section-cmp v-if="isOpen" header="Logs" :noStyle="noStyle" :actions="[{label: 'Clear', icon: 'fas fa-trash', click: () => clear()}]">
    <div v-if="service" class="logs-container" ref="logsContainer" id="terminal">
    </div>
  </section-cmp>
</div>
</template>

<script>
import Stack from '../models/stack'
import Socket from '../helpers/socket';
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import SectionVue from './Section.vue';

export default {
  name: 'Logs',
  components: {
    sectionCmp: SectionVue
  },
  props: {
    service: {default: null},
    noStyle: {default: false},
  },
  watch: {
    async isOpen() {
      this.createTerminal()
    }
  },
  data() {
    return {
      Stack,
      isOpen: true
    }
  },
  async mounted() {
    this.createTerminal()
  },
  methods: {
    async createTerminal() {
      await new Promise(resolve=> setTimeout(resolve, 10));
      if(!this.isOpen) return 
      const terminal = new Terminal({
        experimentalCharAtlas: 'static',
        convertEol: true,
        disableStdin: true,
        fontSize: 13,
        allowTransparency: true,
        minimumContrastRatio: 7,
        theme: {
          background: '#ffffff00',
          foreground: '#4c4c4c',
        }
      });
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      this.terminal = terminal 
      terminal.open(this.$refs.logsContainer);
      fitAddon.activate(terminal)
      fitAddon.fit();
      window.onresize = function() {
      fitAddon.activate(terminal)
        fitAddon.fit();
      }
      const logs = await this.service.getLogs()
      logs.split('\n').map(line => terminal.writeln(line))
      Socket.on('logs:update', data => {
        if(data.label !== this.service.label || !data.msg) return 
        data.msg.trim().split('\n').filter(a => a).map(line => {
          terminal.writeln(line)
        })
      })
      Socket.on('logs:clear', data => {
        if(data.label !== this.service.label) return 
        terminal.clear()
      })
      if(this.$refs.logsContainer) {
        this.$refs.logsContainer.scrollTo({
          'behavior': 'smooth',
          'left': 0,
          'top': this.$refs.logsContainer.offsetHeight + 1000000
        });
      }
    },
    async clear() {
      this.service.clear()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

#terminal {
  width: 100%;
}
.logs-container {
  width: 100%;
  margin: auto;
  height: 400px;
  // height: 1000px;
  box-sizing: border-box;
}

</style>
<style lang="scss">
@import '~xterm/css/xterm.css';


</style>
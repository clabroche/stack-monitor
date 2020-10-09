<template>
  <sections-container header="Npm" v-if="isNpm && packageJson">
    <section-cmp  :key="currentService.label" header="Scripts" maxHeight="400px">
      <div>
        <div>
          <button @click="run('install')">
            <i :class="launched['install'] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          install
        </div>
        <div ref="install" v-scroll-stop></div>
      </div>
      <div>
        <div>
          <button @click="run('rebuild')">
            <i :class="launched['rebuild'] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          rebuild
        </div>
        <div ref="rebuild" v-scroll-stop></div>
      </div>
      <div v-for="(script, key) of packageJson.scripts" :key="key" :title="script">
        <div>
          <button @click="run(key)">
            <i :class="launched[key] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          {{key}}
        </div>
        <div :ref="key" v-scroll-stop>
          
        </div>
      </div>

    </section-cmp>
  </sections-container>
  
</template>

<script>
import socket from '../helpers/socket'
import Service from '../models/service'
import SectionVue from './Section.vue'
import SectionsContainerVue from './SectionsContainer.vue'
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
export default {
  components: {
    sectionsContainer: SectionsContainerVue,
    sectionCmp: SectionVue,
  },
  props: {
    currentService: {
      /** @type {import('../models/service').default}*/
      default: null,
      required: true,
      type: Service
    },
  },
  data() {
    return {
      isNpm: false,
      packageJson: null,
      launched: {}
    }
  },
  async mounted() {
    if(this.currentService) {
      this.isNpm = await this.currentService.isNpm()
      this.packageJson = await this.currentService.getPackageJSON()
    }
  },
  methods: {
    async run(command) {
      if(this.currentService) {
        const ref = this.$refs[command][0] ? this.$refs[command][0] : this.$refs[command]
        ref.innerHTML = ''
        const socketId = await this.currentService.runNpmCommand(command)
        const terminal = new Terminal({
          experimentalCharAtlas: 'static',
          convertEol: true,
          disableStdin: true,
          fontSize: 10,
          theme: {
            
          }
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        console.log()
        terminal.open(ref);
        fitAddon.activate(terminal)
        fitAddon.fit();
        this.$set(this.launched, command, true)
        socket.on(socketId, ({msg}) => {
          this.$set(this.launched, command, true)
          if(msg.trim() === '!:;end') {
            this.launched[command] = false
            return
          }
          msg.trim().split('\n').filter(a => a).map(line => {
            terminal.writeln(line)
          })
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fa-spinner {
  animation-name: spin;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear; 
  &, ::before {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 12px;
    height: 12px;
  }
}
@keyframes spin {
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
}
</style>
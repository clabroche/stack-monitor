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
        <div :ref="el => refs.install = el"></div>
      </div>
      <div>
        <div>
          <button @click="run('rebuild')">
            <i :class="launched['rebuild'] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          rebuild
        </div>
        <div :ref="el => refs.rebuild = el"></div>
      </div>
      <div v-for="(script, key) of packageJson.scripts" :key="key" :title="script">
        <div>
          <button @click="run(key)">
            <i :class="launched[key] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          {{key}}
        </div>
        <div :ref="el => refs[key] = el">
          
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
import { onMounted, reactive, ref, watch } from 'vue'
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
  setup(props) {
    const isNpm = ref(false)
    const packageJson = ref(null)
    const launched = reactive({})
    const refs = ref({})
    const reload = async () => {
      if(props.currentService) {
        isNpm.value = await props.currentService.isNpm()
        packageJson.value = await props.currentService.getPackageJSON()
      }
    }
    onMounted(reload)
    watch(() => props.currentService,reload)
    return {
      isNpm,
      packageJson,
      launched,
      refs,
      async run(command) {
        if(props.currentService) {
          const ref = refs.value[command][0] ? refs.value[command][0] : refs.value[command]
          ref.innerHTML = ''
          const socketId = await props.currentService.runNpmCommand(command)
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
          terminal.open(ref);
          fitAddon.activate(terminal)
          fitAddon.fit();
          launched[command] = true
          socket.on(socketId, ({msg}) => {
            launched[command] = true
            if(msg.trim() === '!:;end') {
              launched[command] = false
              return
            }
            msg.trim().split('\n').filter(a => a).map(line => {
              terminal.writeln(line)
            })
          })
        }
      }
    }
  },
}
</script>
<style>
.xterm-helpers {
  /* display: none; */
  visibility: hidden;
}
</style>
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
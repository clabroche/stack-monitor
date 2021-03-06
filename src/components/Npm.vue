<template>
  <div header="Npm" v-if="isNpm && packageJson">
    <section-cmp  :key="currentService.label" header="Scripts" maxHeight="400px">
      <div class="command-container">
        <div class=button-container>
          <button @click="run('install')">
            <i :class="launched['install'] ? 'fas fa-spinner' : 'fas fa-play'" aria-hidden="true"></i>
          </button>
          install
        </div>
        <div :ref="el => refs.install = el"></div>
      </div>
      <div class="command-container">
        <div class=button-container>
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
    <section-cmp  :key="currentService.label" >
      <div class="categ" v-for="categ of ['dependencies','devDependencies']" :key="categ">
        <h2 class="dep-header">{{categ.charAt(0).toUpperCase() + categ.slice(1)}}</h2>
        <div class="dependecies">
          <table>
            <caption>{{categ}} Table</caption>
            <tr>
              <th scope="name">name</th>
              <th class="version" scope="version">version</th>
              <th class="version" scope="wanted">wanted</th>
              <th class="version" scope="latest">latest</th>
            </tr>
            <tr v-for="(version, name) of packageJson[categ]" :key="name">
              <td>{{name}}</td>
              <td>{{version}}</td>
              <td :class="{
                success: outdated?.[name]?.satisfyVersion && outdated?.[name]?.currentVersionCleaned === outdated?.[name]?.satisfyVersion,
                error: outdated?.[name]?.satisfyVersion && outdated?.[name]?.currentVersionCleaned !== outdated?.[name]?.satisfyVersion
              }">
                <spinner :size="20" v-if="!outdated"/>
                <template v-if="outdated?.[name]?.satisfyVersion">
                  <div v-if="outdated?.[name]?.currentVersionCleaned === outdated?.[name]?.satisfyVersion">
                    <i class="fas fa-check" aria-hidden="true"/>
                  </div>
                  <div v-else>
                    <i class="fas fa-times" aria-hidden="true"/>
                    {{outdated?.[name]?.satisfyVersion}}
                  </div>
                </template>
              </td>
              <td :class="{
                success: outdated?.[name]?.latestVersion && outdated?.[name]?.currentVersionCleaned === outdated?.[name]?.latestVersion,
                error: outdated?.[name]?.latestVersion && outdated?.[name]?.currentVersionCleaned !== outdated?.[name]?.latestVersion
              }">
                <spinner :size="20" v-if="!outdated"/>
                <template v-if="outdated?.[name]?.latestVersion">
                  <div v-if="outdated?.[name]?.latestVersion && outdated?.[name]?.currentVersionCleaned === outdated?.[name]?.latestVersion">
                    <i class="fas fa-check" aria-hidden="true"/>
                  </div>
                  <div v-else>
                    <i class="fas fa-times" aria-hidden="true"/>
                    {{outdated?.[name]?.latestVersion}}
                  </div>
                </template>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section-cmp>
  </div>
  
</template>

<script>
import socket from '../helpers/socket'
import Service from '../models/service'
import SectionVue from './Section.vue'
// @ts-ignore
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';
import { onMounted, reactive, ref, watch } from 'vue'
import Spinner from './Spinner.vue';
export default {
  components: {
    sectionCmp: SectionVue,
    Spinner,
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
    const outdated = ref(null)
    const launched = reactive({})
    const refs = ref({})
    const reload = async () => {
      if(props.currentService) {
        isNpm.value = await props.currentService.isNpm()
        packageJson.value = await props.currentService.getPackageJSON()
        outdated.value = await props.currentService.outdatedNpm()
      }
    }
    onMounted(reload)
    watch(() => props.currentService,reload)
    return {
      isNpm,
      packageJson,
      outdated,
      launched,
      refs,
      async run(command) {
        if(props.currentService) {
          const commandRef = refs.value[command][0] ? refs.value[command][0] : refs.value[command]
          commandRef.innerHTML = ''
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
          terminal.open(commandRef);
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
<style lang="scss" scoped>
button {
  width: 20px;
  height: 20px;
  font-size: 0.7em;
  padding: 0;
}
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
.categ {
  &:first-of-type{
    .dep-header {
      margin-top: 0;
    }
  }
  .dep-header {
    margin-top: 40px;
    margin-bottom: 0;
  }
  tr {
    &.success td {
      color: green;
    }
  }
}
table caption {
  display: none;
}
table {
  width: 100%;
  th {
    text-align: left;
    &.version {
      width: 150px;
    }
  }
  tr {
    td.error{
      color: red;
    }
    td.success{
      color: green;
    }
    &:hover {
      background-color: rgba(0,0,0,0.1);
    }
  }
}
</style>
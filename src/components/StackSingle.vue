<template>
  <div class="stack-single">
    <div v-if="Stack.stack" class="sidebar">
      <ul v-if="currentService">
        <li v-for="service of Stack.stack" :key="service.label"
          @click="currentService = service"
          :class="currentService.label === service.label ? 'active': ''">
            {{service.label}}
        </li>
      </ul>
      <div class="system">
        Mem:
        <div class="container">    
          <div class="progress2 progress-moved">
            <div class="progress-bar2" :style="{width: +System.globalInfos.memPercentage + '%'}">
            </div>                       
          </div> 
        </div>
        Cpu:
        <div class="container">    
          <div class="progress2 progress-moved">
            <div class="progress-bar2" :style="{width: +System.globalInfos.cpu *100 + '%'}">
            </div>                       
          </div> 
        </div>
        <button @click="disconnect">Disconnect</button>
      </div>
    </div>
    <div class="content" v-if="currentService">
      <div class="header">{{currentService.label}}</div>
      <div class="scrollable-container">
        <div class="section">
          <div class="content" id="system-banner">
            <div class="systemInfos">
              Mem:
              <div class="container">    
                <div class="progress2 progress-moved">
                  <div class="progress-bar2" :style="{width: System.infos.cpu ? +System.infos.cpu.toFixed(2) + '%' : 0}">
                  </div>                       
                </div> 
              </div>
              CPU:
              <div class="container">    
                <div class="progress2 progress-moved">
                  <div class="progress-bar2" :style="{width: System.infos.mem ? +System.infos.mem.toFixed(2) + '%' : 0}">
                  </div>                       
                </div> 
              </div>
            </div>
            <div class="actions">
              <!-- <button @click="restart">Restart</button> -->
              <button @click="openInVsCode">Open in VsCode</button>
              <a :href="currentService.port" :target="currentService.label"><button v-if="currentService.port">{{currentService.port}}</button></a>
            </div>
          </div>
        </div>

        <div class="git-section">
          <div class="section" v-if="Git.branches.length" :key="currentService.label">
            <div class="title">Branches</div>
            <div class="content">
              <ul>
                <li v-for="(branch, i) of Git.branches" :key="'branch' +i">{{branch}}</li>
              </ul>
            </div>
          </div>

          <div class="section" v-if="Git.status.length">
            <div class="title">Status</div>
            <div class="content">
              <ul>
                <li v-for="(status, i) of Git.status" :key="'status-' + i" v-html="colorStatus(status)">
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="title">
            Logs
            <button @click="clear"> <i class="fas fa-trash"></i> Clear</button>
          </div>
          <div class="content">
            <logs v-if="currentService" :service="currentService" :key="currentService.label"></logs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import Git from '../models/git'
import LogsVue from './Logs.vue';
import Socket from '../helpers/socket'
export default {
  name: 'StackSingle',
  components: {
    logs: LogsVue
  },
  data() {
    return {
      Stack,
      Git,
      System,
      currentService: null,
      port:''
    }
  },
  watch: {
    async currentService() {
      if(!this.currentService) return 
      await Git.getBranches(this.currentService.label)
      await Git.getStatus(this.currentService.label)
    }
  },
  async mounted() {
    await Stack.getCurrentStack()
    if(!this.currentService) this.currentService = Stack.stack[0]
    Socket.on('port:update', data => {
      if(data.label !== this.service.label) return 
      this.currentService.port = data.msg
    })
    this.interval = setInterval(async () => {
      await Git.getBranches(this.currentService.label)
      await Git.getStatus(this.currentService.label)
      await System.getInfos(this.currentService.label)
      await System.getGlobalInfos()
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    colorStatus(status) {
      status = status.trim()
      if(status.charAt(0) === 'D') {
        status = '<span style="color: #ff7f7f; font-weight: bold">D</span>' + status.slice(1) 
      }
      if(status.charAt(0) === 'M') {
        status = '<span style="color: #ffe47f; font-weight: bold">M</span>' + status.slice(1) 
      }
      if(status.charAt(0) === '?') {
        status = '<span style="color: #7fe1ff; font-weight: bold">??</span>' + status.slice(2) 

      }
      return status
    },
    openInVsCode() {
      Stack.openInVsCode(this.currentService.label)
    },
    restart() {
      Stack.restart(this.currentService.label)
    },
    disconnect() {
      System.disconnect()
    },
    clear() {
      Stack.clear(this.currentService.label)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.stack-single {
  display: flex;
  width: 100%;
  .sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0px 0px 11px -1px black;
    width: 200px;
    background-color: rgba(0,0,0,0.5);
    height: 100vh;
    color: white;
    flex-shrink: 0;
    z-index: 3;
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        cursor: pointer;
        transform: translateZ(0);
        transition: background-color 300ms;
        padding: 10px;
        &:hover {
          background-color: rgba(255, 255, 255, 0.4)
        }
        &.active {
          border-left: 3px solid #a6bd1b
        }
      }
    }
  }
  .content {
    width:100%;
    .header {
      font-size: 2em;
      width: 100%;
      text-align: center;
      color: white;
      background-color: rgba(0,0,0,0.2);
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .scrollable-container {
      height: calc(100vh - 80px);
      overflow: auto;
    }
    .section {
      width: 90%;
      margin: auto;
      margin-top: 20px;
      padding: 20px;
      box-sizing: border-box;
      background-color: rgba(0,0,0,0.4);
      color: white;
      .actions {
        display: flex;
        flex-direction: column;
      }
      .title {
        font-size: 1.4em;
        margin-bottom: 20px;
        display: flex;
        justify-content: center;
        position: relative;
        button {
          right:0;
          position: absolute;
        }
      }
      .content {

      }
    }
  }
}
#system-banner {
  display: flex;
  justify-content: space-between;
}
.git-section {
  display: flex;
  width: 90%;
  justify-content: space-between;
  margin: auto;
  height:250px;
  overflow: hidden;
  .content {
    overflow: auto;
    height: 150px;
  }
  .section {
    width: 48% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}


.container {
  width: 100%;
  text-align: center;
  min-width: 200px;
  text-align: center;
}
.progress {
  padding: 6px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08);
}

.progress-bar {	
  height: 18px;
	background-color: #ee303c;  
  border-radius: 4px; 
  transform: translateZ(0);
  transition: 0.4s linear;  
  transition-property: width, background-color;    
}

.progress2 {
  padding: 6px;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.25);  
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08);
}

.progress-bar2 {
  height: 18px;
  border-radius: 30px;
  background-image: 
    linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
  transform: translateZ(0);
  transition: 0.4s linear;  
  transition-property: width, background-color;    
}

.progress-moved .progress-bar2 {
  width: 0%; 
  background-color: #EF476F;  
  animation: progressAnimation 100ms;
}

@keyframes progressAnimation {
  0%   { width: 5%; background-color: #F9BCCA;}
  100% { width: 85%; background-color: #EF476F; }
}
</style>

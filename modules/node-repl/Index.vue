<template>
  <div class="node-repl-root">
    <h1>{{ room }}</h1>
    <div class="content">
      <div class="rooms">
        <input type="text" placeholder="New room..." :style="{ width: '100%' }" @change="newRoom($event.target.value, $event)">
        <div class="room" :class="{ active: room === _room }" v-for="_room of rooms" :key="_room" @click="changeRoom(_room)">
          <div>{{ _room }}</div>
          <button class="small" @click.stop="deleteRoom(_room)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="chat-container" v-if="room">
        <section-cmp header="Input">
          <Editor v-model="code" language="javascript" style="height: 400px" @save="write"></Editor>
          <button @click="write()">Send</button>
        </section-cmp>
        <section-cmp header="Output">
          <div ref="terminalRef"></div>
        </section-cmp>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from '@/helpers/axios'
import socket from '@/helpers/socket'
import SectionCmp from '@/components/Section.vue'
import { nextTick, onMounted, ref, shallowRef } from 'vue'
// @ts-ignore
import { Terminal } from 'xterm/lib/xterm';
import { FitAddon } from 'xterm-addon-fit';

const defaultCode = `
;(async () => {
  // Code...
})()
  .then(console.log)
  .catch(console.error)
`

const textareaRef = ref()
const terminalRef = ref('')
const rooms = ref([])
const room = ref()
const messages = ref({})
let terminal = ref()
const code = ref(defaultCode)

onMounted(async () => {
  socket.on('node-repl:update', ({ msg, clear }) => {
    if (clear) terminal.value.clear()
    if (!msg) return
    msg.trim().split('\n').filter(a => a).map(line => {
      terminal.value.writeln(line)
    })
  })
  reload()
})

async function writeIfCtrl(ev) {
  if(ev.ctrlKey) write()
}
async function write() {
  await axios.post(`/node-repl/chat/${room.value}`, {
    script: code.value
  })
}

async function reload() {
  const { data: _rooms } = await axios.get('/node-repl/rooms')
  rooms.value = _rooms
  if (!room.value) {
    changeRoom(rooms.value?.[0])
  }
  const { data: _room } = await axios.get(`/node-repl/chat/${room.value}`)
  messages.value = _room
  if(_room.script) code.value = _room.script
}
async function deleteRoom(_room) {
  await axios.delete(`/node-repl/rooms/${_room}`)
  await reload()
}

async function newRoom(room, $event) {
  await axios.post('/node-repl/rooms', { room })
  await reload()
  if ($event) $event.target.value = ''
  await changeRoom(room)
}

async function changeRoom(_room) {
  if(!_room) return
  room.value = _room
  messages.value = {}
  code.value = defaultCode
  await reload()
  await nextTick()
  const commandRef = terminalRef.value
  terminalRef.value.innerHTML = ''
  terminal.value = new Terminal({
    experimentalCharAtlas: 'static',
    convertEol: true,
    disableStdin: true,
    fontSize: 14,
    height:'calc(100vh)',
    theme: {

    }
  });
  const fitAddon = new FitAddon();
  terminal.value.loadAddon(fitAddon);
  terminal.value.open(commandRef);
  fitAddon.activate(terminal.value)
  fitAddon.fit();
  if(messages.value?.result) {
    terminal.value?.clear()
    messages.value?.result.trim().split('\n').filter(a => a).map(line => {
      terminal.value.writeln(line)
    })
  }
}

</script>

<style scoped lang="scss">
.node-repl-root,.section-content {
  width: 100%;
}

$leftSize: 200px;
.node-repl-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100vh;
  width: 100%;
  .content {

  box-sizing: border-box;
  display: flex;
  gap: 10px;
  }
    .rooms {
      width: $leftSize;
      flex-shrink: 0;
      gap: 5px;
      display: flex;
      flex-direction: column;
      .room {
        border-left: 1px solid black;
        padding: 5px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);

        cursor: pointer;
        &:hover {
          background-color: rgba(0,0,0,0.05);
        }
        button {
          width: max-content;
          justify-content: center;
          i {
            margin: 0;
          }
        }
        &.active {
          border-left: 4px solid #1d95db;
        }
      }
      input {
        box-sizing: border-box;
        height: 35px;
        border-radius: 20px;
        border: none;
        box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
        padding: 0 10px;

      }
    }
    .chat-container {
      width: calc(100% - $leftSize);
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .toolbar {
          display: flex;
          &>div {
            display: flex;
            flex-direction: column;
          }
        }
      }
    }



}
</style>
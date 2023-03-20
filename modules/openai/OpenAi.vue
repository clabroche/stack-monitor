<template>
 <div class="openai-root">
  <h1>Open ai</h1>
  <div v-if="!ready">
    <input type="text" @change="changeApikey($event.target.value, $event)" placeholder="Apikey...">
    Vous ne pouvez pas encore communiquer avec l'assistant
  </div>
  <div v-else class="content">
    <div class="rooms">
      <input type="text" placeholder="New room..." :style="{width: '100%'}" @change="newRoom($event.target.value, $event)">
      <div class="room" :class="{active: room === _room}" v-for="_room of rooms" :key="_room" @click="changeRoom(_room)">
        <div>{{ _room }}</div>
        <button class="small" @click.stop="deleteRoom(_room)">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="chat-container" v-if="room">
      <h2>{{ room }}</h2>
      <chat :messages="messagesToDisplay" :loading="loading" @send="sendMessage($event)"></chat>
    </div>
  </div>
 </div>
</template>

<script setup>
import Service from '@/models/service'
import axios from '@/helpers/axios'
import Chat from './Chat.vue'
import {computed, ref} from 'vue'
import { onMounted } from "vue";

const ready = ref(false)
const loading = ref(false)
const messages = ref([])
const rooms = ref([])
const room = ref()

onMounted(reload)

async function reload() {
  const {data: _ready} = await axios.get('/openai/ready')
  ready.value = _ready
  const { data: _rooms } = await axios.get('/openai/rooms')
  rooms.value = _rooms
  if(!room.value) {
    room.value = rooms.value?.[0]
  }
  const { data: _messages } = await axios.get(`/openai/chat/${room.value}`)
  messages.value = _messages
}

async function newRoom(room, $event) {
  await axios.post('/openai/rooms', {room})
  await reload()
  if($event) $event.target.value = ''
  await changeRoom(room)
}

async function changeRoom(_room) {
  room.value = _room
  messages.value = []
  await reload()
}

async function changeApikey(apikey, $event) {
  await axios.post('/openai/apikey', { apikey })
  await reload()
  if ($event) $event.target.value = ''
}
async function sendMessage(message) {
  if (!messages.value) messages.value = []
  messages.value.push({ role: 'user', content: message })
  loading.value = true
  await axios.post(`/openai/chat/${room.value}`, { message })
    .finally(() => loading.value = false)
  await reload()
}
async function deleteRoom(_room) {
  await axios.delete(`/openai/rooms/${_room}`)
  await reload()
}
const messagesToDisplay = computed(() => {
  return messages.value?.filter?.(f => f.role !=='system')
})
</script>
<style lang="scss" scoped>
$leftSize: 200px;
.openai-root {
  height: 100vh;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  h1 {
    text-align: center;
  }
  h1, h2 {
    margin-top: 0;
    margin-bottom: 5px;
  }
  .content {
    display: flex;
    gap: 10px;
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
    }


  }

}
</style>
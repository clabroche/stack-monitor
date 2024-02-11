<template>
  <div class="openai-root">
    <div class="header">
      <h1>Open ai</h1>
      <div class="apikey-container">
        <input type="text"
          @change="changeApikey(/**@type {HTMLInputElement}*/($event.target)?.value, $event)"
          placeholder="Apikey...">
      </div>
    </div>
    <div v-if="!ready">
      Vous ne pouvez pas encore communiquer avec l'assistant
    </div>
    <div v-else class="content">
      <div class="rooms">
        <input type="text" placeholder="New room..." :style="{width: '100%'}"
        @change="newRoom(/**@type {HTMLInputElement}*/($event.target)?.value, $event)">
        <div class="room" :class="{active: room === _room}" v-for="_room of rooms" :key="_room"
        @click="changeRoom(_room)">
          <div>{{ _room }}</div>
          <button class="small" @click.stop="deleteRoom(_room)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="chat-container" v-if="room">
        <div class="header">
          <h2>{{ room }}</h2>
          <div class="toolbar">
            <div>
              Temperature:
              <input type="range" min="0" max="2" v-model="temperature" step="0.1">
            </div>
            <div>
              Model:
              <select v-model="model" default="gpt-3.5-turbo">
                <option v-for="_model of models" :value="_model.id">{{_model.id}}</option>
              </select>
            </div>
          </div>
        </div>
        <Chat :messages="messagesToDisplay" :loading="loading" @send="sendMessage($event)"></Chat>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';
import Chat from './Chat.vue';

const ready = ref(false);
const loading = ref(false);
/** @type {import('vue').Ref<import('../../backend/index').OpenAiChat[]>} */
const messages = ref([]);
const rooms = ref([]);

/** @type {import('vue').Ref<{id: string}[]>} */
const models = ref([]);
const room = ref();
const model = ref('gpt-3.5-turbo');
const temperature = ref(0);

onMounted(reload);

async function reload() {
  const { data: _ready } = await axios.get('/openai/ready');
  ready.value = _ready;
  if (!ready.value) return;
  const { data: _rooms } = await axios.get('/openai/rooms');
  rooms.value = _rooms;
  if (!room.value) {
    room.value = rooms.value?.[0];
  }
  const { data: _messages } = await axios.get(`/openai/chat/${room.value}`);
  messages.value = _messages;
  await getModels();
}

/**
 * @param {string} room
 * @param {Event} $event
 */
async function newRoom(room, $event) {
  await axios.post('/openai/rooms', { room });
  await reload();
  if ($event) /** @type {HTMLInputElement} */($event.target).value = '';
  await changeRoom(room);
}
/** @param {string} _room */
async function changeRoom(_room) {
  room.value = _room;
  messages.value = [];
  await reload();
}
/**
 * @param {string} apikey
 * @param {Event} $event
 */
async function changeApikey(apikey, $event) {
  if (!apikey) return;
  await axios.post('/openai/apikey', { apikey });
  await reload();
  if ($event) /** @type {HTMLInputElement} */($event.target).value = '';
}

async function getModels() {
  const { data: _models } = await axios.get('/openai/models');
  models.value = _models.filter((/** @type {*} */m) => m.id.startsWith('gpt') && (m.id.split('-')?.length === 2 || Number.isNaN(+m.id.split('-').pop())));
}

/** @param {string} message */
async function sendMessage(message) {
  if (!messages.value) messages.value = [];
  messages.value.push({ role: 'user', content: message });
  loading.value = true;
  await axios.post(`/openai/chat/${room.value}`, { message, model: model.value, temperature: temperature.value })
    .catch((err) => {
      console.error(err);
      notification.next('error', 'Une erreur s\'est produite');
    })
    .finally(() => { loading.value = false; });
  await reload();
}

/** @param {Room} _room */
async function deleteRoom(_room) {
  await axios.delete(`/openai/rooms/${_room}`);
  await reload();
}
const messagesToDisplay = computed(() => messages.value?.filter?.((f) => f.role !== 'system'));

/**
 * @typedef {{dada:string}} Room
 */
</script>
<style lang="scss" scoped>
.header{
  display: flex;
  justify-content: space-between;
  text-align: center;
  .apikey-container {
    display: flex;
    align-items: center;
  }
}
$leftSize: 200px;
.openai-root {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
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
      width: 0;
      flex-grow: 1;
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

}
</style>

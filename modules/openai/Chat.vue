<template>
  <div class="chat">
    <div class="messages" ref="messagesRef">
      <div v-for="message of messages" :key="message._id" class="message-container"
        :class="{ 'me': message.role === 'user' }">
        <div class="bubble" v-html="message?.content?.trim()?.replaceAll('\n', '<br/>')">
        </div>
        <div class="infos">
          <div>
            {{ dayjs(message.created_at).fromNow() }}
          </div>
          <div v-if="message.total_tokens">{{ message.total_tokens }} tokens</div>
        </div>
      </div>
      <div v-if="loading" class="message-container" >
        <div class="bubble">
          I'm thinking...
        </div>
        <div class="infos">
        </div>
      </div>
    </div>
    <div class="input-container">
      <textarea v-model="messageToSend" @keypress.enter="sendEnter" placeholder="Ecrivez votre message..."
        @input="input"></textarea>
      <button @click="send"><i class="fas fa-envelope"></i></button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('fr')

const props = defineProps({
  messages: { 
    /** @type {import('./index').OpenAiChat[]} */
    default: [],
    required: true
  },
  loading: { type: Boolean },
})

const emit = defineEmits([
  'send'
])

const messagesRef = ref()
const messageToSend = ref('')

let firstMount = true
onMounted(reload)
async function reload() {
  const shouldScroll = messagesRef.value.scrollTop + messagesRef.value.clientHeight === messagesRef.value.scrollHeight
  setTimeout(() => {
    if (firstMount || shouldScroll) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    firstMount = false
  }, 0);
}
watch(() => props.messages, () => {
  reload()
}, {deep:true})

/** @param {KeyboardEvent} ev */
async function sendEnter(ev) {
  if (ev.ctrlKey) send(ev)
}
/** @param {Event} ev */
async function input(ev) {
  if(ev.target) {
    /**@type {HTMLElement}*/(ev.target).style.height = 'calc(1em + 15px)';
    /**@type {HTMLElement}*/(ev.target).style.height = /**@type {HTMLElement}*/(ev.target).scrollHeight + 'px'
  }
}
/** @param {Event} ev */
async function send(ev) {
  if (messageToSend.value) {
    await emit('send', messageToSend.value)
    if(ev.target) {
      /**@type {HTMLElement}*/(ev.target).style.height = 'calc(1em + 15px)';
      /**@type {HTMLElement}*/(ev.target).style.height = /**@type {HTMLElement}*/(ev.target).scrollHeight + 'px'
    }
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    messageToSend.value = ''
    await reload()
  }
}

/** @type {NodeJS.Timer} */
let interval
onMounted(() => {
  interval = setInterval(reload, 1000)
})
onBeforeUnmount(() => clearInterval(interval))
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 200px);
  background: white;

  border-top-left-radius: 50px;
  border-top-right-radius: 50px;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.1);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
  padding: 10px;
  box-sizing: border-box;

  .message-container {
    box-sizing: border-box;
    width: max-content;
    max-width: 75%;
    display: flex;
    flex-direction: column;

    .bubble {
      width: max-content;
      max-width: 100%;
      color: white;
      border-radius: 10px;
      background-color: darkgrey;
      padding: 10px 10px;
    }

    .infos {
      display: flex;
      flex-direction: column;
      color: grey;
      padding-top: 5px;
      font-size: 0.8em;
    }

    &.me {
      align-self: flex-end;

      .bubble {
        align-self: flex-end;
        $gradient: 50deg, #1d95db 0%, #074971 100%;
        background: -webkit-linear-gradient($gradient);
        background: linear-gradient($gradient);
        color: white;
      }
      .infos {
        justify-content: flex-end;
      }
    }
  }
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  background: white;
  width: calc(100% - 10px);
  margin: auto;
  margin-bottom: 5px;
  textarea {
    height: max-content;
    height: calc(1em + 15px);
    flex-grow: 1;
    border: none;
  }
}
</style>
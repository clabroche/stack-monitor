<template>
  <div class="diff-root">
    <h1>GlobalScripts</h1>
    <div class="content">
      <div class="rooms">
        <div class="room" :class="{ active: currentScript?.label === script.label }" v-for="script of globalScripts" :key="script.label" @click="selectScript(script)">
          <div>{{ script.label }}</div>
        </div>
      </div>
      <div class="chat-container" v-if="currentScript">
        <SectionCmp :header="currentScript.label" :actions="[
          {label: 'Launch', icon: 'fas fa-play', click: launch}
        ]">
          <div class="pipelines">
            <div
              v-for="step of currentScript.pipeline" :key="step.label"
              class="pipeline" :class="{
                valid: track.steps[step.id]?.isValidated,
                error: !!track.steps[step.id]?.error,
                current: track.currentStep === step.id,
              }"
            >
              <h2>{{ step.label }}</h2>
              <template v-if="track.currentStep === step.id && step.prompt">
                <div>{{ step.prompt.question }}</div>
                <input v-if="step.prompt.type === 'boolean'" type="checkbox" v-model="track.steps[track.currentStep].promptValue">
                <input v-else-if="step.prompt.type === 'number'" type="number" v-model="track.steps[track.currentStep].promptValue">
                <select v-else-if="['select', 'multi-select'].includes(step.prompt.type || '')" v-model="track.steps[track.currentStep].promptValue" :multiple="step.prompt.type === 'multi-select'">
                  <option v-for="option of track.steps[track.currentStep].promptOptions || []" :value="option.value"> {{ option.label }}</option>
                </select>
                <input type="text" v-else v-model="track.steps[track.currentStep].promptValue">
                <button @click="validatePrompt">Validate</button>
              </template>
              <div v-if="track.steps[step.id]?.error" v-html="track.steps[step.id].error"></div>
              <div v-if="track.steps[step.id]" v-html="track.steps[step.id].printData"></div>
            </div>
          </div>
        </SectionCmp>
      </div>
    </div>
  </div>
</template>

<script setup>
import SectionCmp from '../../src/components/Section.vue'
import { onMounted, ref } from 'vue';
import axios from '../../src/helpers/axios'
import Socket from '@/helpers/Socket';

/** @type {import('vue').Ref<GlobalScript[]>} */
const globalScripts = ref([])

/** @type {import('vue').Ref<import('./GlobalScripts').TrackStep>} */
const track = ref({
  currentStep: '',
  steps: {},
  output: {},
  prompts: {},
  scriptId: '',
})

const communicationId = ref('')

/** @type {import('vue').Ref<GlobalScript | null>} */
const currentScript = ref(null)

onMounted(reload)
Socket.socket.on('reloadScripts', reload);
async function reload() {
  const { data: scripts } = await axios.get('/global-scripts/')
  globalScripts.value = scripts || []
  if (!currentScript.value && globalScripts.value?.length) await selectScript(globalScripts.value[0])
}


/** @param {GlobalScript} script */
async function selectScript(script) {
  currentScript.value = script
  track.value = {
    currentStep: '',
    steps: {},
    output: {},
    prompts: {},
    scriptId: '',
  }
}

async function launch() {
  if (!currentScript.value?.label) return
  const { data: _communicationId } = await axios.post('/global-scripts/' + currentScript.value.label)
  Socket.socket.on(_communicationId, (/** @type {string} */ ev, /** @type {any} */data) => {
    if (ev === 'track') track.value = data
  })
  communicationId.value = _communicationId
  Socket.socket.emit(communicationId.value, 'launch')
}

async function validatePrompt() {
  Socket.socket.emit(communicationId.value, 'prompt', track.value.steps[track.value.currentStep].promptValue)
}

/**
 * @typedef {import('./GlobalScripts').GlobalScript} GlobalScript
 */
</script>

<style scoped lang="scss">
$leftSize: 200px;
.diff-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
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

  .pipelines {
    display: flex;
    flex-direction: column;
    gap: 20px;
    .pipeline {
      position: relative;
      &::after {
        content: '⇓';
        position: absolute;
        top: 100%;
        width: 100%;
        text-align: center;
      }
      &:last-of-type {
        &::after {
          display: none;
        }
      }
      padding: 10px;
      box-sizing: border-box;
      border-left: 3px solid #000000;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      border-color: #adabab;
      background: linear-gradient(90deg, rgba(199,199,199,1) 0%, rgba(0,0,0,0) 100%);
      &.valid {
        border-color: #5fc151;
        background: linear-gradient(90deg, rgba(171,221,173,1) 0%, rgba(0,0,0,0) 100%);
      }
      &.current {
        border-color: #829fc1;
        background: linear-gradient(90deg, rgba(168,214,255,1) 0%, rgba(0,0,0,0) 100%);
      }
      &.error {
        border-color: #dd766d;
        background: linear-gradient(90deg, rgba(239,163,163,1) 0%, rgba(0,0,0,0) 100%);
      }
      h2 {
        margin: 0;
      }
    }

  }
</style>
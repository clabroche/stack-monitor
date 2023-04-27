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
              v-for="step of displayedSteps" :key="step.label"
              class="pipeline" :class="{
                valid: track.steps[step.id]?.isValidated,
                error: !!track.steps[step.id]?.error,
                current: track.currentStep === step.id,
                loading: track.loadingStep === step.id,
                skipped: track.steps[step.id]?.skipped === true,
              }"
            >
              <h2>{{ step.label }}</h2>
              <template v-if="track.currentStep === step.id && step.prompt && step.id !== track.loadingStep">
                <div>{{ step.prompt.question }}</div>
                <input v-if="step.prompt.type === 'boolean'" type="checkbox" v-model="track.steps[track.currentStep].promptValue">
                <input v-else-if="step.prompt.type === 'number'" type="number" v-model="track.steps[track.currentStep].promptValue">
                <Multiselect v-else-if="step.prompt.type === 'select'"
                    :options="track.steps[track.currentStep].promptOptions"
                    customLabel="label"
                    :single="true"
                    @update:value="track.steps[track.currentStep].promptValue = $event[0]?.value"
                  />
                <Multiselect v-else-if="step.prompt.type === 'multi-select'"
                  :options="track.steps[track.currentStep].promptOptions"
                  customLabel="label"
                  @update:value="track.steps[track.currentStep].promptValue = $event.map(a => a?.value)"
                />
                <input type="text" v-else v-model="track.steps[track.currentStep].promptValue">
                <button @click="validatePrompt">Validate</button>
              </template>
              <template v-else-if="step.id === track.loadingStep">
                <Spinner></Spinner>
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
import { computed, onMounted, ref } from 'vue';
import axios from '../../src/helpers/axios'
import Socket from '@/helpers/Socket';
import Spinner from '@/components/Spinner.vue';
import Multiselect from '@/components/Multiselect.vue';

/** @type {import('vue').Ref<GlobalScript[]>} */
const globalScripts = ref([])

/** @type {import('vue').Ref<import('./GlobalScripts').TrackStep>} */
const track = ref({
  currentStep: '',
  loadingStep: '',
  steps: {},
  output: {},
  prompts: {},
  scriptId: '',
})

const communicationId = ref('')

/** @type {import('vue').Ref<GlobalScript | null>} */
const currentScript = ref(null)

const test = (a) => {
  console.log(a)

}
onMounted(reload)
Socket.socket.on('reloadScripts', reload);
async function reload() {
  const { data: scripts } = await axios.get('/global-scripts/')
  globalScripts.value = scripts || []
  if (!currentScript.value && globalScripts.value?.length) await selectScript(globalScripts.value[0])
}

const displayedSteps = computed(() => {
  const index = (currentScript.value?.pipeline || []).findIndex(s => s.id === track.value.currentStep)
  return (currentScript.value?.pipeline || []).filter((s, i) => (index === -1 || i < index + 1) && !track.value.steps[s.id]?.skipped)
})

/** @param {GlobalScript} script */
async function selectScript(script) {
  currentScript.value = script
  track.value = {
    currentStep: '',
    loadingStep: '',
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
  Socket.socket.emit(communicationId.value, 'validate-prompt', track.value.steps[track.value.currentStep].promptValue)
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
    height: 100%;
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
      height: 100%;
      &>* {
        height: 100%;
        margin: 0;
      }
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
      &.loading {
        border-color: rgb(180, 166, 34);
        background: linear-gradient(90deg, rgb(204, 187, 33) 0%, rgba(0,0,0,0) 100%);
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
<template>
  <div class="node-repl-root">
    <h1>{{ room }}</h1>
    <div class="content">
      <div class="rooms">
        <InputText 
          v-model="newRoomInput"
          placeholder="New room..." 
          class="w-full" 
          @keyup.enter="() => {
            if (newRoomInput) {
              newRoom(newRoomInput);
              newRoomInput = '';
            }
          }"
        />
        <div class="room" :class="{ active: room === _room }" v-for="_room of rooms" :key="_room"
        @click="changeRoom(_room)">
          <div>{{ _room }}</div>
          <Button 
            icon="fas fa-trash" 
            severity="secondary" 
            text 
            size="small" 
            @click.stop="deleteRoom(_room)"
          />
        </div>
      </div>
      <div class="chat-container" v-if="room">
        <section-cmp header="Input">
          <div class="editor-container">
            <Editor 
              v-model="code" 
              language="javascript" 
              style="height: 400px" 
              @save="write"
              :options="{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                cursorStyle: 'line',
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
                wordWrap: 'on',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                acceptSuggestionOnEnter: 'on',
                snippetSuggestions: 'top',
                parameterHints: { enabled: true },
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                renderWhitespace: 'selection',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                  arrowSize: 30
                },
                keybindings: [
                  {
                    key: 'ctrl+enter',
                    command: '-editor.action.insertLineAfter'
                  },
                  {
                    key: 'ctrl+shift+f',
                    command: '-editor.action.formatDocument'
                  },
                  {
                    key: 'ctrl+l',
                    command: '-expandLineSelection'
                  }
                ]
              }"
            ></Editor>
            <div class="editor-toolbar">
              <Button 
                icon="fas fa-code" 
                severity="secondary" 
                text 
                @click="formatCode" 
                v-tooltip="'Format Code (Ctrl+Shift+F)'"
              />
              <Button 
                icon="fas fa-play" 
                severity="secondary" 
                text 
                @click="write" 
                v-tooltip="'Run Code (Ctrl+Enter, Ctrl+S)'"
              />
              <Button 
                icon="fas fa-trash" 
                severity="secondary" 
                text 
                @click="clearOutput" 
                v-tooltip="'Clear Output (Ctrl+L)'"
              />
              <Button 
                icon="fas fa-cog" 
                severity="secondary" 
                text 
                @click="showEnvModal = true" 
                v-tooltip="'Environment Variables'"
              />
              <Button 
                icon="fas fa-box" 
                severity="secondary" 
                text 
                @click="showPackagesModal = true" 
                v-tooltip="'NPM Packages'"
              />
            </div>
          </div>
        </section-cmp>
        <section-cmp style="overflow: auto; flex-grow: 1;">
          <template #header>
            <div class="output-header">
              <span>Output</span>
              <div class="output-header-actions">
                <span v-if="outputLines.length && outputLines[0].timestamp" class="execution-time">⏱️ {{ outputLines[0].timestamp }}ms</span>
                <Button 
                  icon="fas fa-expand" 
                  severity="secondary" 
                  text 
                  @click="showOutputModal = true"
                  v-tooltip="'Expand Output'"
                />
              </div>
            </div>
          </template>
          <div class="output-container" ref="outputContainerRef" style="overflow: auto;">
            <div v-for="(line, index) in outputLines" :key="index" :class="['output-line', line.type]">
              <span v-if="line.type === 'error'" class="error-icon">❌</span>
              <span class="line-content">{{ line.content }}</span>
            </div>
          </div>
        </section-cmp>
      </div>
    </div>

    <!-- Remplacer la modal personnalisée par un Dialog -->
    <Dialog 
      v-model:visible="showEnvModal" 
      modal 
      :style="{ width: '50vw' }" 
      class="env-modal"
    >
      <template #header>
        <div class="env-modal-header">
          <span>Environment Variables</span>
        </div>
      </template>
      <div class="env-list">
        <div v-for="(value, key) in envVars" :key="key" class="env-item">
          <span class="env-key">{{ key }}</span>
          <span class="env-value">{{ value }}</span>
          <Button 
            icon="fas fa-trash" 
            severity="danger" 
            text 
            size="small" 
            @click="removeEnvVar(key)"
          />
        </div>
      </div>
      <div class="env-form">
        <InputText 
          v-model="newEnvKey" 
          placeholder="Key" 
        />
        <InputText 
          v-model="newEnvValue" 
          placeholder="Value" 
        />
        <Button 
          icon="fas fa-plus" 
          size="small" 
          severity="secondary" 
          :disabled="!newEnvKey || !newEnvValue"
          @click="addEnvVar"
        />
      </div>
    </Dialog>

    <!-- Modal pour l'output -->
    <Dialog 
      v-model:visible="showOutputModal" 
      modal 
      :style="{ width: '90vw', height: '90vh' }" 
      :maximizable="true"
      class="output-modal"
    >
      <template #header>
        <div class="output-modal-header">
          <span>Output</span>
          <Button 
            icon="fas fa-sync" 
            severity="secondary" 
            text 
            @click="() => scrollToBottom(modalOutputContainerRef)"
            v-tooltip="'Scroll to bottom'"
          />
        </div>
      </template>
      <div class="output-modal-content" ref="modalOutputContainerRef">
        <div v-for="(line, index) in outputLines" :key="index" :class="['output-line', line.type]">
          <span v-if="line.type === 'error'" class="error-icon">❌</span>
          <span v-if="line.timestamp" class="execution-time">⏱️ {{ line.timestamp }}ms</span>
          <span class="line-content">{{ line.content }}</span>
        </div>
      </div>
    </Dialog>

    <!-- NPM Packages Modal -->
    <Dialog 
      v-model:visible="showPackagesModal" 
      modal 
      :style="{ width: '50vw' }" 
      class="packages-modal"
    >
      <template #header>
        <div class="packages-modal-header">
          <span>NPM Packages</span>
        </div>
      </template>
      <div class="packages-list">
        <div v-for="(version, name) in installedPackages" :key="name" class="package-item">
          <span class="package-name">{{ name }}</span>
          <span class="package-version">{{ version }}</span>
          <Button 
            icon="fas fa-trash" 
            severity="danger" 
            text 
            size="small" 
            @click="removePackage(name)"
          />
        </div>
      </div>
      <div class="packages-form">
        <InputText 
          v-model="newPackageName" 
          placeholder="Package name (e.g., lodash)" 
          class="flex-1"
        />
        <div class="version-input-container">
          <InputText 
            v-model="newPackageVersion" 
            placeholder="Version (e.g., 4.4.7)" 
            class="w-40"
          />
          <div class="version-shortcuts">
            <Button 
              icon="fas fa-code-branch" 
              severity="secondary" 
              text 
              size="small"
              @click="() => newPackageVersion = '^' + newPackageVersion"
              v-tooltip="'Add caret (^) for minor updates'"
            />
            <Button 
              icon="fas fa-code-branch" 
              severity="secondary" 
              text 
              size="small"
              @click="() => newPackageVersion = '~' + newPackageVersion"
              v-tooltip="'Add tilde (~) for patch updates'"
            />
            <Button 
              icon="fas fa-asterisk" 
              severity="secondary" 
              text 
              size="small"
              @click="() => newPackageVersion = '*'"
              v-tooltip="'Latest version'"
            />
          </div>
        </div>
        <Button 
          icon="fas fa-plus" 
          label="Install"
          severity="secondary" 
          :disabled="!newPackageName"
          @click="installPackage"
        />
      </div>
      <div v-if="packageError" class="package-error">
        {{ packageError }}
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import Socket from '../../../../fronts/app/src/helpers/Socket';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import { useEventListener } from '@vueuse/core';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Tooltip from 'primevue/tooltip';
import Dialog from 'primevue/dialog';

/**
 * @typedef {string} Room
 */

/**
 * @typedef {Object} OutputLine
 * @property {'stdout' | 'stderr' | 'error'} type - Output type
 * @property {string} content - Line content
 * @property {number} [timestamp] - Execution time in ms
 */

/**
 * @typedef {Object} EnvVar
 * @property {string} key - Environment variable key
 * @property {string} value - Environment variable value
 */

const defaultCode = `
;(async () => {
  // Code...
})()
  .then(console.log)
  .catch(console.error)
`;

// Application state
/** @type {import('vue').Ref<string[]>} */
const rooms = ref([]);
/** @type {import('vue').Ref<Room>} */
const room = ref('');
/** @type {import('vue').Ref<{result?: string}>} */
const messages = ref({});
/** @type {import('vue').Ref<string>} */
const code = ref(defaultCode);
/** @type {import('vue').Ref<Record<string, string>>} */
const envVars = ref({});

// Modal state
/** @type {import('vue').Ref<boolean>} */
const showEnvModal = ref(false);
/** @type {import('vue').Ref<boolean>} */
const showOutputModal = ref(false);

// Form state
/** @type {import('vue').Ref<string>} */
const newEnvKey = ref('');
/** @type {import('vue').Ref<string>} */
const newEnvValue = ref('');
/** @type {import('vue').Ref<string>} */
const newRoomInput = ref('');

// DOM references
/** @type {import('vue').Ref<{type: 'stdout' | 'stderr' | 'error', content: string, timestamp?: number}[]>} */
const outputLines = ref([]);
/** @type {import('vue').Ref<HTMLElement | undefined>} */
const outputContainerRef = ref();
/** @type {import('vue').Ref<HTMLElement | undefined>} */
const modalOutputContainerRef = ref();
/** @type {import('vue').Ref<number>} */
const executionStartTime = ref(0);

// Packages state
/** @type {import('vue').Ref<boolean>} */
const showPackagesModal = ref(false);
/** @type {import('vue').Ref<string>} */
const newPackageName = ref('');
/** @type {import('vue').Ref<string>} */
const newPackageVersion = ref('');
/** @type {import('vue').Ref<Record<string, string>>} */
const installedPackages = ref({});
/** @type {import('vue').Ref<string>} */
const packageError = ref('');

// Keyboard shortcuts handling
useEventListener('keydown', (e) => {
  // Ctrl+Enter or Ctrl+S to execute
  if (e.ctrlKey && (e.key === 'Enter' || e.key.toLowerCase() === 's')) {
    e.preventDefault();
    e.stopPropagation();
    write();
    return;
  }

  // Ctrl+L to clear
  if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    e.stopPropagation();
    clearOutput();
    return;
  }

  // Ctrl+Shift+F to format
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    e.stopPropagation();
    formatCode();
    return;
  }
}, { capture: true });

// Socket events handling
onMounted(async () => {
  Socket.on('node-repl:update', handleSocketUpdate);
  await reload();
});

/**
 * Scroll to bottom of a container
 * @param {HTMLElement | undefined} container
 */
function scrollToBottom(container) {
  nextTick(() => {
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

/**
 * Handle socket updates
 * @param {{ msg: string, clear: boolean, type: 'stdout' | 'stderr' | 'error' }} data
 */
function handleSocketUpdate({ msg, clear, type }) {
  if (clear) {
    outputLines.value = [];
  }
  if (!msg) return;
  
  const lines = msg.trim().split('\n').filter(a => a);
  lines.forEach(line => {
    outputLines.value.push({
      type,
      content: line,
      timestamp: type === 'stdout' && !outputLines.value.length ? Date.now() - executionStartTime.value : undefined
    });
  });
  
  scrollToBottom(outputContainerRef.value);
}

async function write() {
  try {
    executionStartTime.value = Date.now();
    await axios.post(`/node-repl/chat/${room.value}`, {
      script: code.value,
    });
  } catch (error) {
    console.error('Error executing script:', error);
  }
}

async function formatCode() {
  try {
    const response = await axios.post('/node-repl/format', {
      code: code.value
    });
    code.value = response.data.formatted;
  } catch (error) {
    console.error('Error formatting code:', error);
  }
}

function clearOutput() {
  outputLines.value = [];
}

async function reload() {
  try {
    const { data: _rooms } = await axios.get('/node-repl/rooms');
    rooms.value = _rooms;
    if (!room.value) {
      await changeRoom(rooms.value?.[0]);
    }
    const { data: _room } = await axios.get(`/node-repl/chat/${room.value}`);
    messages.value = _room;
    if (_room.script) code.value = _room.script;
  } catch (error) {
    console.error('Error reloading:', error);
  }
}

/** @param {Room} _room */
async function deleteRoom(_room) {
  try {
    await axios.delete(`/node-repl/rooms/${_room}`);
    await reload();
  } catch (error) {
    console.error('Error deleting room:', error);
  }
}

/**
 * @param {Room} room
 */
async function newRoom(room) {
  try {
    await axios.post('/node-repl/rooms', { room });
    await reload();
    await changeRoom(room);
  } catch (error) {
    console.error('Error creating room:', error);
  }
}

async function loadEnvVars() {
  try {
    const { data } = await axios.get(`/node-repl/env/${room.value}`);
    envVars.value = data;
  } catch (error) {
    console.error('Error loading environment variables:', error);
  }
}

async function addEnvVar() {
  if (!newEnvKey.value || !newEnvValue.value) return;
  
  try {
    const updatedEnv = {
      ...envVars.value,
      [newEnvKey.value]: newEnvValue.value
    };
    
    await axios.post('/node-repl/env', {
      room: room.value,
      env: updatedEnv
    });
    
    envVars.value = updatedEnv;
    newEnvKey.value = '';
    newEnvValue.value = '';
  } catch (error) {
    console.error('Error adding environment variable:', error);
  }
}

async function removeEnvVar(key) {
  try {
    const updatedEnv = { ...envVars.value };
    delete updatedEnv[key];
    
    await axios.post('/node-repl/env', {
      room: room.value,
      env: updatedEnv
    });
    
    envVars.value = updatedEnv;
  } catch (error) {
    console.error('Error removing environment variable:', error);
  }
}

/** @param {Room} _room */
async function changeRoom(_room) {
  if (!_room) return;
  room.value = _room;
  messages.value = {};
  code.value = defaultCode;
  outputLines.value = [];
  await reload();
  await loadEnvVars();
  await nextTick();

  if (messages.value?.result) {
    messages.value?.result.trim().split('\n').filter((a) => a).forEach((line) => {
      outputLines.value.push({
        type: 'stdout',
        content: line
      });
    });
  }
  // Scroll to bottom after loading messages
  nextTick(() => {
    if (outputContainerRef.value) {
      outputContainerRef.value.scrollTop = outputContainerRef.value.scrollHeight;
    }
  });
}

// Load installed packages
async function loadPackages() {
  try {
    const { data } = await axios.get(`/node-repl/packages/${room.value}`);
    installedPackages.value = data;
  } catch (error) {
    console.error('Error loading packages:', error);
  }
}

// Install new package
async function installPackage() {
  if (!newPackageName.value) return;
  
  try {
    packageError.value = '';
    const packageSpec = newPackageVersion.value 
      ? `${newPackageName.value}@${newPackageVersion.value}`
      : newPackageName.value;

    await axios.post('/node-repl/install', {
      package: packageSpec,
      room: room.value
    });
    
    await loadPackages();
    newPackageName.value = '';
    newPackageVersion.value = '';
  } catch (error) {
    console.error('Error installing package:', error);
    if (error.response?.data?.error?.includes('npm ERR! 404')) {
      packageError.value = `Package "${newPackageName.value}" not found on npm`;
    } else {
      packageError.value = error.response?.data?.error || 'Error installing package';
    }
  }
}

// Remove package
async function removePackage(name) {
  try {
    await axios.delete(`/node-repl/packages/${room.value}/${name}`);
    await loadPackages();
  } catch (error) {
    console.error('Error removing package:', error);
  }
}

// Load packages when modal is opened
watch(showPackagesModal, async (newValue) => {
  if (newValue) {
    await loadPackages();
  }
});
</script>

<style scoped lang="scss">
.node-repl-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;

  h1 {
    margin: 0;
    font-size: 24px;
    color: var(--system-text-textColor);
  }
}

.content {
  display: flex;
  gap: 20px;
  min-height: 0;
  flex-grow: 1;
}

$leftSize: 200px;

.rooms {
  width: $leftSize;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  padding: 10px;
  background: var(--system-secondary-backgroundColor);
  border-radius: 4px;
  height: 100%;

  .room {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    border: 1px solid transparent;

    &:hover {
      background: var(--system-secondary-backgroundColor-darker);
    }

    &.active {
      background: var(--system-secondary-backgroundColor-darker);
      border-color: var(--system-secondary-backgroundColor-darker);
      font-weight: bold;
    }

    button {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover button {
      opacity: 1;
    }
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow: hidden;

  :deep(.section-content) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}

.editor-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.monaco-editor) {
    flex: 1;
    min-height: 0 !important;
  }
}

.editor-toolbar {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--system-secondary-backgroundColor);
  border-radius: 4px;
  margin-top: 10px;
  flex-shrink: 0;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  border-radius: 4px 4px 0 0;

  .output-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.execution-time {
  font-weight: bold;
  font-size: 14px;
}

.output-container {
  flex: 1;
  border-radius: 0 0 4px 4px;
  padding: 10px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.env-list {
  margin-bottom: 20px;

  .env-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: var(--system-secondary-backgroundColor);
    border-radius: 4px;
    margin-bottom: 8px;
    border: 1px solid var(--system-primary-backgroundColor-darker);

    .env-key {
      font-weight: bold;
      min-width: 150px;
      color: var(--system-text-textColor);
    }

    .env-value {
      flex: 1;
      word-break: break-all;
      color: var(--system-text-textColor);
    }
  }
}

.env-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

:deep(.p-inputtext) {
  width: 100%;
  background: var(--system-secondary-backgroundColor);
  border: 1px solid var(--system-primary-backgroundColor-darker);
  color: var(--system-text-textColor);

  &:focus {
    outline: none;
    border-color: var(--system-accent-backgroundColor2);
  }
}

:deep(.p-button) {
  &.p-button-text {
    &:hover {
      background: var(--system-secondary-backgroundColor);
    }
  }
}

.output-modal {
  :deep(.p-dialog-content) {
    padding: 0;
    height: calc(100% - 60px);
  }

  :deep(.p-dialog-header) {
    padding: 1rem;
    border-bottom: 1px solid var(--system-secondary-backgroundColor);
  }
}

.output-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.output-modal-content {
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  .output-line {
    padding: 4px 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    &.stderr, &.error {
      color: #ff6b6b;
    }

    &.stdout {
      color: var(--system-text-textColor);
    }

    .error-icon {
      color: #ff6b6b;
      flex-shrink: 0;
    }

    .execution-time {
      font-weight: bold;
      flex-shrink: 0;
    }

    .line-content {
      flex: 1;
      min-width: 0;
    }
  }
}

.env-modal {
  :deep(.p-dialog-content) {
    padding: 1rem;
  }

  :deep(.p-dialog-header) {
    padding: 1rem;
    border-bottom: 1px solid var(--system-secondary-backgroundColor);
  }
}

.env-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.packages-list {
  margin-bottom: 20px;

  .package-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: var(--system-secondary-backgroundColor);
    border-radius: 4px;
    margin-bottom: 8px;
    border: 1px solid var(--system-primary-backgroundColor-darker);

    .package-name {
      font-weight: bold;
      min-width: 150px;
      color: var(--system-text-textColor);
    }

    .package-version {
      flex: 1;
      color: var(--system-text-textColor);
    }
  }
}

.version-input-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 200px;

  .version-shortcuts {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }
}

.packages-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.packages-modal {
  :deep(.p-dialog-content) {
    padding: 1rem;
  }

  :deep(.p-dialog-header) {
    padding: 1rem;
    border-bottom: 1px solid var(--system-secondary-backgroundColor);
  }
}

.packages-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.package-error {
  color: #ff6b6b;
  margin-top: 10px;
  font-size: 14px;
  padding: 8px;
  background: var(--system-secondary-backgroundColor);
  border-radius: 4px;
  border: 1px solid #ff6b6b;
}
</style>

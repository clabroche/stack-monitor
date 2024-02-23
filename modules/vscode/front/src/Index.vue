<template>
  <div class="vscode-root" >
    <template v-if="view === 'default'">
      <h1>
        It seems you use Visual Studio Code
      </h1>
      <div>Do you want to install / update extension for it ?</div>
      <br>
      <button @click="udpate">
        <i class="fas fa-download"></i>
        Install / Udpate
      </button>
      or
      <button class="danger" @click="uninstall">
        <i class="fas fa-trash"></i>
        Uninstall
      </button>
    </template>
    <template v-else-if="view === 'reload'">
      <h1>Success !</h1>
      <div>Open the command palette (Ctrl + Shift + P) and execute the command >Reload Window</div>
      <br>
      <button @click="view = 'default'">
        <i class="fas fa-chevron-left"></i>
        Back
      </button>
    </template>
    <template v-else-if="view === 'error'">
      <h1>Sorry an error was occured</h1>
      <br>
      <div>{{ error }}</div>
      <br>
      <button @click="view = 'default'">
        <i class="fas fa-chevron-left"></i>
        Back
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';

const view = ref('default');
const error = ref('');

async function udpate() {
  await axios.post('/vscode/install')
    .then(() => {
      view.value = 'reload';
    })
    .catch((err) => {
      error.value = err?.message || err;
      view.value = 'error';
    });
}
async function uninstall() {
  await axios.delete('/vscode/uninstall')
    .then(() => {
      view.value = 'reload';
    })
    .catch((err) => {
      error.value = err?.response?.data?.message || err?.message || err;
      view.value = 'error';
    });
}
</script>

<style lang="scss" scoped>

.vscode-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-grow: 1;
}
</style>

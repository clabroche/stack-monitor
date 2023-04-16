<template>
  <div class="banner" v-if="currentEnvironment" :style="{
    backgroundColor: currentEnvironment.bgColor || 'transparent',
    color: currentEnvironment.color || 'transparent',
  }">
    <div>{{ currentEnvironment.label }}</div>
    <div>
      <select :value="// @ts-ignore
                      currentEnvironment.id"
              @input="changeEnvironment(/**@type {HTMLInputElement}*/($event.target).value)">
        <option :value="id" v-for="(env, id) of environments" :key="id">
          {{ env?.label }}
        </option>
      </select>
    </div>
  </div>
  <Teleport to="body" v-if="loading">
    <div class="reload-modal">
      <Spinner></Spinner>
      Change environments...
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Stack from '../models/stack'
import notification from '../helpers/notification'
import Spinner from './Spinner.vue';

/** @type {import('vue').Ref<import('../../server/models/stack').Environment | null>} */
const currentEnvironment = ref(null)
/** @type {import('vue').Ref<Record<string, import('../../server/models/stack').Environment | null>>} */
const environments = ref({})
const loading = ref(false)
onMounted(async () => {
  currentEnvironment.value = await Stack.getEnvironment()
  environments.value = await Stack.getEnvironments()
})

/**@param {string} env*/
async function changeEnvironment(env) {
  loading.value = true
  await Stack.changeEnvironment(env)
    .then(() => {
      window.location.reload()
    })
    .catch(err => {
      console.error(err)
      notification.next('error', 'Problem has occured')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style lang="scss" scoped>
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
  position: relative;
  z-index: 10;
}

.reload-modal {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000000000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
  color: #0076bc;
  background-color: rgba(255,255,255,0.5);
}
</style>
<template>
  <div class="json-root">
    <h1>JWT</h1>
    <section-cmp>
      <div class="section-content">
        <editor v-model="code" language="json" style="height: calc(100vh - 200px)"></editor>
        <div class="json-viewer">
          <div>
            Show Raw
            <input type="checkbox" v-model="showRaw">
          </div>
          <div v-if="showRaw" class="raw"> 
            <pre v-html="raw"></pre>
          </div>
          <json-viewer v-else :value="json" :copyable="true" :expand-depth="1" :show-double-quotes="true"/>
        </div>
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import { ref, watchEffect } from 'vue'
import JsonViewer from 'vue-json-viewer'
import axios from '@/helpers/axios'

const showRaw = ref(false)
const json = ref({})
const raw = ref('')
const code = ref(`// Paste JWT...`)

watchEffect(async () => {
  try {
    const { data: jwtData } = await axios.post('/JWT', {jwt: code.value})
    json.value = jwtData
    raw.value = JSON.stringify(json.value, null, 2).split('\n').join('<br/>')
  } catch (error) {
  }
})
</script>

<style scoped lang="scss">
.json-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.section-content {
  display: flex;
  gap: 5px;
  flex-direction: row;
  height: calc(100vh - 200px);
}

.json-viewer {
  width: 50%;
  flex-shrink: 0;
  height: 100%;
}
.raw {
  padding: 10px;
  border: 1px solid #999;
  margin: auto;
  align-self: center;
  border-radius: 10px;
}
</style>

<style>
.json-viewer-tab{
  margin-left: 20px;
}
</style>
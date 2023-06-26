<template>
  <div class="json-root">
    <h1>JSON</h1>
    <section-cmp>
      <div class="section-content">
        <editor
          v-model="code"
          language="json"
          style="height:calc(100vh - 200px)"
        />
        <div class="json-viewer">
          <div class="valid" v-if="isValid">Valid JSON</div>
          <div class="invalid" v-else>Invalid JSON</div>
          <div>
            Show Raw
            <input type="checkbox" v-model="showRaw">
          </div>
          <div v-if="showRaw" class="raw"> 
            <pre v-html="raw"></pre>
          </div>
          <json-viewer v-else :value="json" :copyable="true" :expand-depth="6" :show-double-quotes="true"/>
        </div>
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import { ref, watchEffect } from 'vue'
import JsonViewer from 'vue-json-viewer'
import { useRouter } from 'vue-router';
const router = useRouter(); 

const initialJSON = router.currentRoute.value.query.json?.toString()
const showRaw = ref(false)
const json = ref({})
const raw = ref('')
const code = ref(initialJSON || `{}`)
const isValid = ref(true)

watchEffect(() => {
  isValid.value = true 
  try {
    json.value = JSON.parse(code.value)
    raw.value = JSON.stringify(json.value, null, 2).split('\n').join('<br/>')
  } catch (error) {
    isValid.value = false
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
.invalid {
  width: 100%;
  background-color: red;
  padding: 10px;
  box-sizing: border-box;
  color: white;
}
.valid {
  width: 100%;
  background-color: green;
  padding: 10px;
  box-sizing: border-box;
  color: white;
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
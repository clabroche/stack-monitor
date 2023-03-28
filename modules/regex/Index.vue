<template>
  <div class="json-root">
    <h1>Regex</h1>
    <section-cmp>
      <div class="section-content">
        <div>
          <input type="text" v-model="regexString" placeholder="Regex...">
          <div ref="monacoRef" style="height:400px"></div>
        </div>
        <div class="json-viewer">
          <div>
            Show Raw
            <input type="checkbox" v-model="showRaw">
          </div>
          <div v-if="showRaw" class="raw"> 
            <pre v-html="raw"></pre>
          </div>
          <json-viewer v-else :value="json" :copyable="true" :expand-depth="10" :show-double-quotes="true"/>
        </div>
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import { onMounted, ref, shallowRef, watchEffect } from 'vue'
import JsonViewer from 'vue-json-viewer'
import axios from '@/helpers/axios'
import * as monaco from 'monaco-editor';

const showRaw = ref(false)
const json = ref({})
const raw = ref('')
const regexString = ref('.*(est) (un) .*')
const code = ref(`Ceci est un test
Ceci est un test
Ceci est un test
Ceci est un test`)

const monacoRef = ref()
/** @type {import('vue').ShallowRef<import('monaco-editor').editor.IStandaloneCodeEditor>} */
let editor = shallowRef()

onMounted(() => {
  const _editor = monaco.editor.create(monacoRef.value, {
    theme: 'vs-dark',
    readOnly: false,
    automaticLayout: true,
    autoIndent: 'brackets',
    formatOnPaste: true,
    formatOnType: true,
  })
  _editor.setModel(monaco.editor.createModel('', 'text/plain'));
  _editor.updateOptions({ readOnly: false });
  _editor.setValue(code.value)
  _editor.onDidChangeModelContent((model) => {
    code.value = _editor.getValue()
  })
  
  editor.value = _editor
})

let decorations = []
watchEffect(async () => {
  decorations.forEach(d => d.clear())
  decorations = []
  try {
    const results = []
    if(!regexString.value) {
      json.value = [] 
      return 
    }
    code.value.split('\n').forEach((line, lineNumber) => {
      const regex = new RegExp(regexString.value, 'gid')
      const result = [...line.matchAll(regex)].map((result) => {
        const [match, ...groups] = result
        const {input, index, indices} = result
        return {
          match, groups, input, index, indices
        }
      })
      results.push(result)
      result.forEach(r => {
        r.indices.forEach((range, groupNumber) => {
          const decoration = editor.value?.createDecorationsCollection([
            {
              range: {
                "startLineNumber": lineNumber+1,
                "endLineNumber": lineNumber+1,
                "startColumn": range[0] + 1,
                "endColumn": range[1] + 1
              },
              options: {
                isWholeLine: false,
                inlineClassName: `highlight-${groupNumber}`
              }
            },
          ]);
          if(decoration) decorations.push(decoration)
        })
      })
    })

    json.value = results
    raw.value = JSON.stringify(json.value, null, 2).split('\n').join('<br/>')
  } catch (error) {
    console.error(error)
  }
})
</script>

<style scoped lang="scss">
.json-root,.section-content {
  display: flex;
  flex: 1 1;
  flex-direction: column;
  align-items: center;
  width: 100%;
  &>* {
    flex-grow: 1;
    width: 100%;
  }
}
.section-content {
  display: flex;
  gap: 10px;
  height: calc(100vh - 100px);
  input {
    margin: 10px 0;
    width: 100%;
  }
}

.json-viewer {
  width: 100%;
  flex-shrink: 0;
  height: 100%;
  height: calc(100vh / 2);
  overflow: auto;
}
.raw {
  padding: 10px;
  border: 1px solid #999;
  margin: auto;
  align-self: center;
  border-radius: 10px;
}


</style>

<style lang="scss">
.json-viewer-tab{
  margin-left: 20px;
}
.highlight- {
  &0 {
    background-color: rgb(187, 127, 16);
  }
  &1 {
    background-color: rgb(81, 158, 36);
  }
  &2 {
    background-color: rgb(9, 127, 143);
  }
}
</style>
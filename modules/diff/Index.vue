<template>
  <div class="diff-root">
    <h1>Differences</h1>
    <section-cmp>
      <div ref="monacoRef" style="height: calc(100vh - 200px)"></div>
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import axios from '@/helpers/axios'
import {ref, onMounted} from 'vue'
import * as monaco from 'monaco-editor';
const code = ref('')
const monacoRef = ref('')
onMounted(() => {
  const editor = monaco.editor.createDiffEditor(monacoRef.value, {
    theme: 'vs-dark',
    readOnly: false,
    automaticLayout: true,
    autoIndent: 'brackets',
    formatOnPaste: true,
    formatOnType: true,
  })
  editor.setModel({
    original: monaco.editor.createModel('', 'text/plain'),
    modified: monaco.editor.createModel('', 'text/plain'),
  });
  editor.updateOptions({ readOnly: false, originalEditable: true });
})
function onMountEditor(editor) {
}
</script>

<style scoped lang="scss">
.diff-root,.section-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
</style>
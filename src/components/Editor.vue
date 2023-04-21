<template>
  <div ref="monacoRef" class="monaco"></div>
</template>

<script setup>
import { nextTick, onMounted, ref, shallowRef, watchEffect } from 'vue'
import * as monaco from 'monaco-editor';
// @ts-ignore
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// @ts-ignore
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// @ts-ignore
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// @ts-ignore
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// @ts-ignore
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

const props = defineProps({
  modelValue: { default: '' },
  language: { default: 'text/plain' },
  diff: { default: false }
})
const emit = defineEmits([
  'update:modelValue',
  'save',
])

const monacoRef = ref()
const isReady = ref(false)
/** @type {import('vue').ShallowRef<import('monaco-editor').editor.IStandaloneDiffEditor | import('monaco-editor').editor.IStandaloneCodeEditor | undefined>} */
let editor = shallowRef()

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

onMounted(async() => {
  /** @type {import('monaco-editor/esm/vs/editor/editor.api').editor.IStandaloneDiffEditorConstructionOptions} */
  const options = {
    theme: 'vs-dark',
    readOnly: false,
    automaticLayout: true,
    autoIndent: 'brackets',
    formatOnPaste: true,
    formatOnType: true,
  }
  if(props.diff) {
    const _editor = monaco.editor.createDiffEditor(monacoRef.value, options)
    _editor.setModel({
      original: monaco.editor.createModel('', 'text/plain'),
      modified: monaco.editor.createModel('', 'text/plain'),
    });
    _editor.updateOptions({ readOnly: false, originalEditable: true });
    editor.value = _editor
  } else {
    const _editor = monaco.editor.create(monacoRef.value, options)
    _editor.setModel(monaco.editor.createModel('', props.language));
    _editor.updateOptions({ readOnly: false });
    _editor.onDidChangeModelContent((model) => {
      emit('update:modelValue', _editor.getValue())
    })
    const KM = monaco.KeyMod;
    const KC = monaco.KeyCode;
    _editor.addCommand(KM.chord(KM.CtrlCmd, KC.KeyS), function () {
      //...
      emit('save', _editor.getValue())
    });

    editor.value = _editor
  }
  await nextTick()
  isReady.value = true
})

watchEffect(() => {
  // @ts-ignore
  if(editor.value && props.modelValue !== editor.value?.getValue?.()) {
    // @ts-ignore
    editor.value?.setValue?.(props.modelValue)
  }
})
defineExpose({
  editor,
  isReady
})
</script>


<style lang="scss" scoped>
.monaco {
  flex-grow: 1;
}
</style>
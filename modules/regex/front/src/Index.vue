<template>
  <div class="json-root">
    <h1>Regex</h1>
    <section-cmp>
      <div class="section-content">
        <div class="editor-container">
          Inert your regex:
          <input type="text" v-model="regexString" placeholder="Regex...">
          <Editor ref="monacoRef" style="height: 400px"
            v-model="code"
          />
        </div>
        <div class="json-viewer">
          <div>
            Show Raw
            <input type="checkbox" v-model="showRaw">
          </div>
          <div v-if="showRaw" class="raw">
            <pre v-html="raw"></pre>
          </div>
          <JsonTreeView v-else :maxDepth="10" :json="JSON.stringify(json)" :copyable="true"/>
        </div>
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { JsonTreeView } from 'json-tree-view-vue3';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';

const showRaw = ref(false);
const json = ref({});
const raw = ref('');
const regexString = ref('.*');
const code = ref('Place your lines to test...');

const monacoRef = ref();
/** @type {import('monaco-editor').editor.IEditorDecorationsCollection[]} */
let decorations = [];
watchEffect(async () => {
  if (!monacoRef.value?.isReady) return;
  decorations.forEach((d) => d.clear());
  decorations = [];
  try {
    /** @type {Array<{match: string, groups: string[], input: string | undefined, index: number | undefined, indices: RegExpIndicesArray | undefined}>[]} */
    const results = [];
    if (!regexString.value) {
      json.value = [];
      return;
    }
    code.value.split('\n').forEach((line, lineNumber) => {
      const regex = new RegExp(regexString.value, 'gid');
      const result = [...line.matchAll(regex)].map((result) => {
        const [match, ...groups] = result;
        const { input, index, indices } = result;
        return {
          match, groups, input, index, indices,
        };
      });
      results.push(result);
      result.forEach((r) => {
        r.indices?.forEach((range, groupNumber) => {
          const decoration = /** @type {IStandaloneCodeEditor} */(monacoRef.value?.editor)
            ?.createDecorationsCollection([
              {
                range: {
                  startLineNumber: lineNumber + 1,
                  endLineNumber: lineNumber + 1,
                  startColumn: range[0] + 1,
                  endColumn: range[1] + 1,
                },
                options: {
                  isWholeLine: false,
                  inlineClassName: `highlight-${groupNumber}`,
                },
              },
            ]);
          if (decoration) decorations.push(decoration);
        });
      });
    });

    json.value = results;
    raw.value = JSON.stringify(json.value, null, 2).split('\n').join('<br/>');
  } catch (error) {
    console.error(error);
  }
});

/**
 * @typedef {import('monaco-editor').editor.IStandaloneCodeEditor} IStandaloneCodeEditor
 */
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
  align-items: center;
  gap: 10px;
  height: calc(100vh - 100px);
  .editor-container {
    flex-grow: 0;
    input {
      margin: 0 0;
      margin-bottom: 10px;
      width: 100%;
    }
  }
  input[type="checkbox"] {
    width: auto;
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

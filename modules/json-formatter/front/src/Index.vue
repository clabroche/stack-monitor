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
          <div class="line">
            <button class="small" @click="openDiagram">
              Tree view
            </button>
            <button class="small" @click="copy(JSON.stringify(repairedJSON))">
              Copy minified json
            </button>
            <button class="small" @click="copy(JSON.stringify(repairedJSON, null, 2))">
              Copy json
            </button>
          </div>
          <div v-if="showRaw" class="raw">
            <pre v-html="raw"></pre>
          </div>
          <JsonTreeView v-else :maxDepth="6" :json="stringifiedJSON" :copyable="true"/>
        </div>
      </div>
    </section-cmp>
    <Modal ref="jsonCrackRef" validateString="Ok" :noCancel="true">
      <template #header="">
        JSON crack
      </template>
      <template #body="" >
        <div class="jsoncrack-container">
          <iframe width="100%" height="100%" ref="jsoncrackEmbed" id="jsoncrackEmbed" :src="`https://jsoncrack.com/widget`" />
        </div>
      </template>
    </Modal>
  </div>

</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { JsonTreeView } from 'json-tree-view-vue3';
import { useRouter } from 'vue-router';
import { jsonrepair } from 'jsonrepair';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import notification from '../../../../fronts/app/src/helpers/notification';
import Modal from '../../../../fronts/app/src/components/Modal.vue';

const router = useRouter();

const initialJSON = router.currentRoute.value.query.json?.toString();
const showRaw = ref(false);
const jsonCrackRef = ref();
const jsoncrackEmbed = ref();
const openDiagram = async () => {
  jsonCrackRef.value.open();
  await nextTick();
  jsoncrackEmbed.value.onload = () => {
    jsoncrackEmbed.value.contentWindow.postMessage({
      json: stringifiedJSON.value,
    }, '*');
  };
};
const repairedJSON = computed(() => {
  try {
    return JSON.parse(code.value);
  } catch (error) {
    try {
      return JSON.parse(jsonrepair(code.value));
    } catch (error) {
      return {};
    }
  }
});

const stringifiedJSON = computed(() => {
  try {
    return JSON.stringify(repairedJSON.value);
  } catch (error) {
    return '{}';
  }
});

const raw = computed(() => {
  try {
    return JSON.stringify(repairedJSON.value, null, 2).split('\n').join('<br/>');
  } catch (error) {
    return '';
  }
});

const code = ref(initialJSON || '{}');

const isValid = computed(() => {
  try {
    JSON.parse(code.value);
    return true;
  } catch (error) {
    return false;
  }
});

/** @param {string} data */
function copy(data) {
  navigator.clipboard.writeText(data)
    .then(() => notification.next('success', 'Data copied to clipboard'));
}
</script>

<style scoped lang="scss">
.line {
  display: flex;
}
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
.jsoncrack-container {
  height: 80vh;
}
</style>

<style>
.json-viewer-tab{
  margin-left: 20px;
}
</style>

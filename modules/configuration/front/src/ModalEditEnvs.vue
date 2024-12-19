<template>
  <div class="root">
    <Modal ref="modalEditEnv" :no-cancel="true" validateString="Close" :maxHeight="'80vh'" :noScroll="false"
      class="modal">
      <template #header>
        Edit
        <Select
          size="small"
          v-model="showEnvironment"
          @change="changeEnvironment"
          :options="extendsEnvironments.filter(a => a)"
          placeholder="Select an environment" />
        environment
      </template>
      <template #body  v-if="command">
        <div class="line spaced">
          <div></div>
          <div>
            <Button size="small" label="Import view" @click="toggleimportView()"/>
            <Button size="small" label="Export env" @click="exportEnv()"/>
          </div>
        </div>
        <div class="line spaced">
          <div class="line">
            <template v-if="!importView">
              <i class="fas fa-plus"></i>
              <InputText
                size="small"
                icon="fas fa-plus"
                v-model="envToAdd.key"
                placeholder="Add new Env"
                @keypress.enter="addEnv()"></InputText>
              </template>
          </div>
          <div class="line" v-if="!!extendsEnvironments.filter(a => a && a !== currentEnvironment.label).length">
            <div>Extends env variables from</div>
             <Select size="small"
               v-model="envs.extends[0]"
               :options="extendsEnvironments.filter(a => a !== currentEnvironment.label)"
               @change="save"
               placeholder="Choose an environment" />
          </div>
        </div>
        <DataTable scrollable class="datatable" size="small"   v-if="!importView" sortField="key" :sortOrder="1"
          :value="envs.envs"
          tableStyle="width: 100%;">
            <Column field="action" header="" :row-span="2" col>
              <template #body="{ data }">
                <Button :disabled="!!data.systemOverride" size="small" @click="deleteEnv(data.key)">
                  <i class="fas fa-times"></i>
                </Button>
              </template>
            </Column>
            <Column field="key" header="Key" sortable>
              <template #body="{ data, field }">
                <span :style="{
                  color: {
                    'normal': 'green',
                    'systemOverride': 'red',
                    override: 'orange'
                  }[(data.systemOverride && 'systemOverride') || (data.override && 'override') || 'normal']
                }">
                  {{ data[field] }}
                </span>
              </template>
            </Column>
            <Column field="value" header="Value" style="min-width: 200px;">
              <template #body="{ data, field }">
                <div v-if="data[field].match(/{{(.*)}}/gi)">
                  variable:
                </div>
                <InputText v-model="data[field]" @input="editEnv(data)" autofocus fluid @blur="save" @keypress.enter="save"/>
                <div v-if="data[field].match(/{{(.*)}}/gi)">
                  Global variable value:
                  <InputText v-model="currentEnvironment.envs[extractTag(data[field])]" @blur="saveEnvironment" @keypress.enter="saveEnvironment" autofocus fluid />
                </div>
              </template>
            </Column>
            <Column field="override" header="Override" style="min-width: 200px;">
              <template #body="{ data, field }">
                <InputText v-model="data[field]" @input="editEnv(data)" autofocus fluid @blur="save" @keypress.enter="save"/>
              </template>
            </Column>
            <Column field="systemOverride" header="System override">
              <template #body="{ data, field }">
                {{ data[field] }}
              </template>
            </Column>
        </DataTable>
        <div v-else>
          <Textarea v-model="code" @input="parseCode()"></Textarea>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext'; // optional
import Textarea from 'primevue/textarea'; // optional
import Button from 'primevue/button';
import { cloneDeep } from 'lodash';
import Select from 'primevue/select';
import Modal from '../../../../fronts/app/src/components/Modal.vue';
import stack from '../../../../fronts/app/src/models/stack';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';

const command = ref();
const commandIndex = ref();
const envs = ref({
  extends: [],
  /** @type {{value: string, key: string, override: string, systemOverride?: string}[]} */
  envs: [],
});
const props = defineProps({
  service: null,
});

const modalEditEnv = ref();
const importView = ref(false);
const code = ref('');
function toggleimportView() {
  if (!importView.value) {
    code.value = `# key=value
${envs.value.envs.map((env) => `${env.key}=${env.value}`).join('\n')}
`;
  }
  importView.value = !importView.value;
}
/** @type {import('vue').Ref<string[]>} */
const extendsEnvironments = ref([]);
function extractTag(field) {
  const extractedTag = /{{(.*)}}/gi.exec(field)?.[1]?.trim();
  return extractedTag;
}
function parseCode() {
  envs.value.envs = code.value
    .split('\n')
    .filter((line) => !line.trim().startsWith('#') && line.trim())
    .map((envString) => {
      const [key, ...value] = envString.split('=');
      const env = envs.value.envs.find((env) => env.key === key) || {
        key, value: '', systemOverride: '', override: '',
      };
      env.value = value.join('=');
      return env;
    });
}

const envToAdd = ref({
  key: '', value: '', override: '', systemOverride: '',
});
function addEnv() {
  envs.value.envs.push(cloneDeep(envToAdd.value));
  envToAdd.value = {
    key: '', value: '', override: '', systemOverride: '',
  };
  save();
}

async function editEnv(data) {
  const env = envs.value.envs.find((env) => env.key === data.key);
  Object.assign(env, data);
}

async function exportEnv() {
  const { data: exportedEnv } = await axios.get('/stack/export-env', { params: { environment: currentEnvironment.value.label, service: props.service.label, commandIndex: commandIndex.value } });
  const envObject = exportedEnv;
  const envString = Object.keys(envObject).map((key) => `${key}=${envObject[key]}`).join('\n');
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(envString)}`);
  element.setAttribute('download', '.env');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

async function save() {
  if (props.service) {
    await axios.post('/stack/create-service', props.service)
      .then(() => notification.next('success', 'Configuration sauvegardée'));
  }
}
async function saveEnvironment() {
  await axios.patch(`/stack/environments/${currentEnvironment.value.label}`, currentEnvironment.value)
    .then(() => notification.next('success', 'Environment saved'))
    .catch(() => notification.next('success', 'Environment cant be saved'));
}
async function open({command: _command, commandIndex: _commandIndex}) {
  command.value = _command;
  commandIndex.value = _commandIndex;
  changeEnvironment();
  return modalEditEnv.value.open().promise;
}
async function changeEnvironment() {
  if (!command.value.spawnOptions.envs[showEnvironment.value]) {
    command.value.spawnOptions.envs[showEnvironment.value] = { extends: [], envs: [] };
  }
  currentEnvironment.value = environments.value.find((a) => a.label === showEnvironment.value) || { label: 'unknown' };
  envs.value = command.value.spawnOptions.envs[showEnvironment.value];
}
async function deleteEnv(key) {
  envs.value.envs = envs.value.envs.filter((env) => env.key !== key);
  save();
}
/** @type {import('vue').Ref<{label: string}[]>} */
const environments = ref([]);
/** @type {import('vue').Ref<{label: string}>} */
const currentEnvironment = ref({ label: '' });
const showEnvironment = ref('');
onMounted(async () => {
  currentEnvironment.value = await stack.getEnvironment();
  environments.value = await stack.getEnvironments();
  showEnvironment.value = currentEnvironment.value.label;
  extendsEnvironments.value = environments.value
    .map((env) => env.label);
  extendsEnvironments.value.unshift('');
});
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
  .modal {
    height: 100%;
    overflow: auto;
  }
  button.small {
    width: max-content;
    i {
      margin: 0;
      padding: 0;
    }
  }
  .override {
    input {
      margin-bottom: 20px;
      margin-top: 20px;
    }
  }
  .datatable {
    display: flex;
    width: 100%;
    overflow: auto;
  }

  ::v-deep {
    .p-datatable-table-container {
      width: 100%;
    }
  }
  .line {
    display: flex;
    gap: 10px;
    align-items: center;
    &.spaced {
      justify-content: space-between;
    }
  }
  textarea {
    width: 100%;
    height: 50vh;
  }
</style>

<template>
  <div class="root">
    <Modal ref="modalEditEnv" :noCancel="true" validateString="Close" :maxHeight="'80vh'" :noScroll="false">
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
            <IftaLabel :style="{minWidth: '190px'}">
              <Select size="small"
                v-model="service.commands[commandIndex].spawnOptions.envs[currentEnvironment.label].extends[0]"
                :options="extendsEnvironments.filter(a => a !== currentEnvironment.label)"
                @change="save"
                fluid
                placeholder="Choose an environment" />
              <label>Extends env variables from</label>
            </IftaLabel>
          </div>
        </div>
        <DataTable scrollable class="datatable" size="small"   v-if="!importView" sortField="key" :sortOrder="1"
          :value="getEnvs()"
          tableStyle="width: 100%;">
            <Column field="action" header="" :row-span="2" col :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }">
              <template #body="{ data }">
                <Button :disabled="!!data.systemOverride" size="small" @click="deleteEnv(data.key)">
                  <i class="fas fa-times"></i>
                </Button>
              </template>
            </Column>
            <Column field="key" header="Key" sortable :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }" :style="{maxWidth: '14rem'}">
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
            <Column field="value" header="Value" style="min-width: 200px;" :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }">
              <template #body="{ data, field }">
                <IftaLabel>
                  <AutoComplete
                    v-model="data.value"
                    dropdown
                    size="small"
                    :suggestions="items"
                    @complete="search"
                    @input="() => setOverrideIfNeeded(data)"
                    @change="() => setOverrideIfNeeded(data)"
                    autofocus
                    fluid
                    @blur="save"
                    @keypress.enter="save"/>
                  <label>Variable</label>
                </IftaLabel>
                <div v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                  <IftaLabel size="small" :style="{marginTop: '4px'}">
                    <InputText
                      v-model="currentEnvironment.envs[extractTag(data[field])]"
                      @blur="saveEnvironment"
                      @keypress.enter="saveEnvironment"
                      autofocus
                      fluid />
                      <label>Update variable value globally</label>
                  </IftaLabel>
                </div>
              </template>
            </Column>
            <Column field="override" header="Override" style="min-width: 200px;" :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }">
              <template #body="{ data, field }">
                <IftaLabel>
                  <InputText
                    :disabled="!!extractTag(data.override)"
                    v-model="data[field]"
                    autofocus
                    fluid
                    @blur="save"
                    @keypress.enter="save"/>
                  <label>Variable</label>
                </IftaLabel>
                <div v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                  <IftaLabel size="small" :style="{marginTop: '4px'}">
                    <InputText
                      v-model="currentEnvironment.envs[extractTag(data[field])]"
                      @blur="saveEnvironment"
                      @keypress.enter="saveEnvironment"
                      autofocus
                      fluid />
                      <label>Update variable value globally</label>
                  </IftaLabel>
                </div>
              </template>
            </Column>
            <Column field="systemOverride" header="System override">
              <template #body="{ data, field }">
                {{ data[field] }}
              </template>
            </Column>
        </DataTable>
        <div v-else>
          <Textarea v-model="code" @input="parseCode()" @blur="save"></Textarea>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext'; // optional
import Textarea from 'primevue/textarea'; // optional
import Button from 'primevue/button';
import { cloneDeep, endsWith } from 'lodash';
import Select from 'primevue/select';
import IftaLabel from 'primevue/iftalabel';
import AutoComplete from 'primevue/autocomplete';
import Modal from '../../../../fronts/app/src/components/Modal.vue';
import stack from '../../../../fronts/app/src/models/stack';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';

const command = ref();
const commandIndex = ref();

const items = ref([]);
const search = (event) => {
  const query = extractTag(event.query) || event.query;
  items.value = Object.keys(currentEnvironment.value.envs)
    .filter((key) => key.toUpperCase().includes(query.toUpperCase()) && !key.toUpperCase().includes('STACKMONITOR_OVERRIDE'))
    .map((key) => `{{${key}}}`);
};

const props = defineProps({
  service: {
    /** @type {import('../../../../fronts/app/src/models/service').default | null} */
    default: null,
  },
});

const modalEditEnv = ref();
const importView = ref(false);
const code = ref('');
function toggleimportView() {
  if (!importView.value) {
    code.value = `# key=value
${getEnvs().map((env) => `${env.key}=${env.value}`).join('\n')}
`;
  }
  importView.value = !importView.value;
}
/** @type {import('vue').Ref<string[]>} */
const extendsEnvironments = ref([]);
function extractTag(field) {
  const extractedTag = /{{(.*)}}/gi.exec(field)?.[1]?.trim();
  return extractedTag || '';
}

function getEnvs() {
  return props.service.commands[commandIndex.value].spawnOptions.envs[showEnvironment.value].envs;
}
function setEnvs(env) {
  props.service.commands[commandIndex.value].spawnOptions.envs[showEnvironment.value].envs = env;
  return env;
}

function parseCode() {
  setEnvs(
    code.value
      .split('\n')
      .filter((line) => !line.trim().startsWith('#') && line.trim())
      .map((envString) => {
        const [key, ...value] = envString.split('=');
        const env = getEnvs().find((env) => env.key === key) || {
          key, value: '', systemOverride: '', override: '',
        };
        env.value = value.join('=');
        setOverrideIfNeeded(env);
        return env;
      }),
  );
}

const envToAdd = ref({
  key: '', value: '', override: '', systemOverride: '',
});
function addEnv() {
  setEnvs([
    ...getEnvs(),
    cloneDeep(envToAdd.value),
  ]);
  envToAdd.value = {
    key: '', value: '', override: '', systemOverride: '',
  };
  save();
}
function setOverrideIfNeeded(data) {
  if (extractTag(data.value)) data.override = `{{${extractTag(data.value)}_STACKMONITOR_OVERRIDE}}`;
  else if (extractTag(data.override)) {
    data.override = '';
  }
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
    await props.service.save()
      .then(() => notification.next('success', 'Configuration saved'))
      .catch(() => notification.next('error', 'Cannot save configuration'));
  }
}
async function saveEnvironment() {
  await axios.patch(`/stack/environments/${currentEnvironment.value.label}`, currentEnvironment.value)
    .then(() => notification.next('success', 'Environment saved'))
    .catch(() => notification.next('success', 'Environment cant be saved'));
}
async function open({ command: _command, commandIndex: _commandIndex }) {
  command.value = _command;
  commandIndex.value = _commandIndex;
  await changeEnvironment();
  return modalEditEnv.value.open().promise;
}
async function changeEnvironment() {
  if (!command.value.spawnOptions.envs[showEnvironment.value]) {
    command.value.spawnOptions.envs[showEnvironment.value] = { extends: [], envs: [] };
  }
  currentEnvironment.value = environments.value.find((a) => a.label === showEnvironment.value) || { label: 'unknown', envs: {}, overrideEnvs: {} };
}
async function deleteEnv(key) {
  setEnvs(getEnvs().filter((env) => env.key !== key));
  save();
}
/** @type {import('vue').Ref<{label: string, envs: Record<string, {envs: string}>, overrideEnvs: Record<string, {envs: string}>, }[]>} */
const environments = ref([]);
/** @type {import('vue').Ref<{label: string, envs: Record<string, {envs: string}>, overrideEnvs: Record<string, {envs: string}>, }>} */
const currentEnvironment = ref({ label: '', envs: {}, overrideEnvs: {} });
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

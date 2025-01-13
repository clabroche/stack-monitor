<template>
  <div class="root">
    <Modal ref="modalEditEnv" :noCancel="true" validateString="Close" :maxHeight="'80vh'" :noScroll="false">
      <template #header>
        <div class="line">
          Edit
          <Select
            size="small"
            v-model="showEnvironment"
            @change="changeEnvironment"
            :options="extendsEnvironments.filter(a => a)"
            placeholder="Select an environment" />
          environment
          <div v-if="currentEnvironment.extends?.[0]">
            <Badge :value="`This environment herit from 
            ${currentEnvironment.extends[0]}
            environment`" size="large" severity="warn"></Badge>
          </div>
        </div>
      </template>
      <template #body>
        <div class="line spaced">
          <div>
            <InputGroup v-if="!importView">
              <InputText
                size="small"
                icon="fas fa-plus"
                v-model="envToAdd"
                placeholder="Add new Env"
                @keypress.enter="addEnv()"/>
              <InputGroupAddon icon>
                <Button size="small" icon="fas fa-plus" @click="addEnv()" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div>
            <Button size="small" :label="importView ? 'Variable view' : 'Import view'" @click="toggleimportView()" icon="fas fa-eye"/>
            <Button size="small" label="Download env" @click="exportEnv()" icon="fas fa-download"/>
          </div>
        </div>
        <DataTable scrollable class="datatable" size="small"   v-if="!importView" sortField="key" :sortOrder="1"
          :value="Object.keys(getEnvs()).map(key => Object.assign(getEnvs()[key], {key}))"
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
                <div class="line">
                  <IftaLabel :style="{flexGrow: 1}">
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
                </div>
                <div class="line">
                  <IftaLabel :style="{flexGrow: 1}" v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                    <InputText
                      v-model="data.prefix"
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
                    <label>Prefix</label>
                  </IftaLabel>
                  
                  <IftaLabel :style="{flexGrow: 1}" v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                    <InputText
                      v-model="data.suffix"
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
                    <label>Suffix</label>
                  </IftaLabel>
                </div>
                <div v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                  <InputGroup>
                      <InputGroupAddon v-if="data.prefix">{{data.prefix}}</InputGroupAddon>
                      <IftaLabel size="small" :style="{marginTop: '4px'}">
                        <InputText
                          v-model="currentEnvironment.envs[extractTag(data[field])]"
                          @blur="saveEnvironment"
                          @keypress.enter="saveEnvironment"
                          autofocus
                          fluid />
                          <label>Update variable value globally</label>
                      </IftaLabel>
                      <InputGroupAddon v-if="data.suffix">{{data.suffix}}</InputGroupAddon>
                  </InputGroup>
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
                <div class="line">
                  <IftaLabel :style="{flexGrow: 1}">
                    <InputText
                      :disabled="!!extractTag(data.override)"
                      v-model="data[field]"
                      autofocus
                      full
                      fluid
                      @blur="save"
                      @keypress.enter="save"/>
                    <label>Variable</label>
                  </IftaLabel>
                </div>
                <div v-if="data[field] && data[field].match(/{{(.*)}}/gi)">
                  <InputGroup>
                      <InputGroupAddon v-if="data.prefix">{{data.prefix}}</InputGroupAddon>
                      <IftaLabel size="small" :style="{marginTop: '4px'}">
                        <InputText
                          v-model="currentEnvironment.envs[extractTag(data[field])]"
                          @blur="saveEnvironment"
                          @keypress.enter="saveEnvironment"
                          autofocus
                          fluid />
                          <label>Update variable value globally</label>
                      </IftaLabel>
                      <InputGroupAddon v-if="data.suffix">{{data.suffix}}</InputGroupAddon>
                    </InputGroup>
                </div>
              </template>
            </Column>
            <Column field="systemOverride" header="System override" :style="{maxWidth: '4rem'}">
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
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputGroup from 'primevue/inputgroup';
import Badge from 'primevue/badge';

const items = ref([]);
const search = (event) => {
  const query = extractTag(event.query) || event.query;
  items.value = Object.keys(currentEnvironment.value.envs)
    .filter((key) => key.toUpperCase().includes(query.toUpperCase()) && !key.toUpperCase().includes('STACK_MONITOR_OVERRIDE'))
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
    const envs = getEnvs()
    code.value = `# key=value
${Object.keys(envs).map((key) => {
  const env = envs[key]
  return `${key}=${env.prefix || ''}${env.value|| ''}${env.suffix || ''}`
}).join('\n')}
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
  return props.service.envs?.[showEnvironment.value] || {}
}
function setEnvs(envs) {
  props.service.envs[showEnvironment.value] = envs;
  return envs;
}

function parseCode() {
  const envs = {}
  code.value
    .split('\n')
    .filter((line) => !line.trim().startsWith('#') && line.trim())
    .forEach((envString) => {
      const [key, ...value] = envString.split('=');
      const env = getEnvs()[key] || {
        value: '', systemOverride: '', override: '', prefix: '', suffix: ''
      };
      env.value = value.join('=');
      envs[key] = env
      setOverrideIfNeeded({key, value: env.value});
    }),
  setEnvs(envs);
}

const envToAdd = ref('');
function addEnv() {
  setEnvs({
    ...getEnvs(),
    [envToAdd.value]: {
      value: '', override: '', systemOverride: '',
    }
  });
  save();
}
function setOverrideIfNeeded({key, value}) {
  if(!props.service.envs[currentEnvironment.value.label][key]) props.service.envs[currentEnvironment.value.label][key] = {
    value: '', override: ''
  }
  const data = props.service.envs[currentEnvironment.value.label][key]
  const tag = extractTag(value)
  if (tag) {
    const res = /(.*){{.*}}(.*)/gi.exec(value)
    data.prefix = res?.[1] || data.prefix || ''
    data.suffix = res?.[2] || data.suffix || ''
    data.value = `{{${tag}}}`
    data.override = `{{${tag}_STACK_MONITOR_OVERRIDE}}`;
  }
  else if (extractTag(data.override)) {
    data.override = '';
  }
}

async function exportEnv() {
  const { data: exportedEnv } = await axios.get('/stack/export-env', { params: { environment: currentEnvironment.value.label, service: props.service.label } });
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
async function open() {
  await changeEnvironment();
  return modalEditEnv.value.open().promise;
}
async function changeEnvironment() {
  currentEnvironment.value = environments.value.find((a) => a.label === showEnvironment.value) || { label: 'unknown', envs: {}, overrideEnvs: {} };
}
async function deleteEnv(key) {
  delete getEnvs()[key]
  save();
}
/** @type {import('vue').Ref<{label: string, envs: Record<string, {envs: string}>, overrideEnvs: Record<string, {envs: string}>, extends: string[]}[]>} */
const environments = ref([]);
/** @type {import('vue').Ref<{label: string, envs: Record<string, {envs: string}>, overrideEnvs: Record<string, {envs: string}>, extends: string[]}>} */
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
    .p-inputgroupaddon {
      line-break: anywhere
    }
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin: 5px 0;
    &.spaced {
      justify-content: space-between;
    }
  }
  textarea {
    width: 100%;
    height: 50vh;
  }
</style>

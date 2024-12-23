<template>
  <SectionCmp header="Environments">
    <div v-for="(environment, i) of environments" :key="environment.label" class="environment column">
      <h3>
        <Button size="small" severity="danger" icon="fas fa-trash" @click="deleteEnvironment(environment)"></Button>
        {{ environment.label }}
      </h3>
      <div>
        <IftaLabel>
          <InputText size="small" fluid v-model="environment.color" @blur="saveEnvironment(environment)" @keypress.enter="saveEnvironment(environment)"></InputText>
          <label>Color: </label>
        </IftaLabel>
      </div>
      <div>
        <IftaLabel>
          <label>Background: </label>
          <InputText size="small" fluid v-model="environment.bgColor" @blur="saveEnvironment(environment)" @keypress.enter="saveEnvironment(environment)"></InputText>
        </IftaLabel>
      </div>
      <div class="line">
        <ToggleSwitch size="small" v-model="environment.default" @click="saveEnvironment(environment)"></ToggleSwitch>
        <label>Default</label>
      </div>
      <Button label="Envs" size="small" @click="openModalEnv(environment)"></Button>
      <Divider v-if="environments[i+1]"></Divider>
      <Modal :ref="(el) => envModalRefs[environment.label] = el" :noScroll="false" :noCancel="true" validateString="Close">
        <template #body>
          <div class="line">
            <div>
              <InputText v-if="!importViewMode" placeholder="Add new variable" @change="ev => addEnv(environment, ev.target.value)" v-model="keyToAdd"></InputText>
            </div>
            <Button :label="importViewMode? 'Import view' : 'Env view'" @click="toggleimportView(environment)"></Button>
          </div>
          <DataTable scrollable class="datatable" size="small"  sortField="key" :sortOrder="1" v-if="!importViewMode"
            :value="parseRawEnvs(environment.envs)"
            tableStyle="width: 100%;">
            <Column field="action" header="" col style="max-width: 1rem" :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }">
              <template #body="{ data }">
                <Button size="small" @click="delete environment.envs[data.key]">
                  <i class="fas fa-times"></i>
                </Button>
              </template>
            </Column>
            <Column field="key" header="Key" col :colspan="1" style="max-width: 5rem" :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }"></Column>
            <Column field="value" header="Value" :colspan="16" col :pt="{
              bodyCell: {
                style: {
                  verticalAlign: 'top'
                }
              }
            }">
              <template #body="{ data, field }">
                <InputText v-model="environment.envs[data.key]" @blur="saveEnvironment(environment)" fluid>
                </InputText>
              </template>
            </Column>
          </DataTable>
          <Textarea  v-else v-model="code" @input="parseCode(environment)" @blur="saveEnvironment(environment)"></Textarea>
        </template>
      </Modal>
    </div>
  </SectionCmp>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import SectionCmp from '../../components/Section.vue';
import Stack from '../../models/stack'
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import axios from '../../helpers/axios';
import notification from '../../helpers/notification';
import Socket from '../../helpers/Socket';
import Divider from 'primevue/divider';
import IftaLabel from 'primevue/iftalabel';
import Modal from '../../components/Modal.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Textarea from 'primevue/textarea';
const keyToAdd = ref('')
function addEnv(environment, value) {
  environment.envs[value] = ''
  keyToAdd.value = ''
}
async function openModalEnv(environment) {
  await envModalRefs.value[environment.label].open().promise
}

const importViewMode = ref(false)
const code = ref('')

function toggleimportView(environment) {
  if (!importViewMode.value) {
    code.value = `# key=value
${Object.keys(environment.envs).map((key) => `${key}=${environment.envs[key]}`).sort(( a,b) => a.localeCompare(b)).join('\n')}
`;
  }
  importViewMode.value = !importViewMode.value;
}
function parseCode(environment) {
  environment.envs = {}
  code.value
      .split('\n')
      .filter((line) => !line.trim().startsWith('#') && line.trim())
      .forEach((envString) => {
        const [key, ...value] = envString.split('=');
        environment.envs[key] = value.join('=')
      })
}

function parseRawEnvs(envs) {
  return Object.keys(envs).map((key) => ({ key, value: envs[key] }));
}
const envModalRefs = ref({})
/** @type {import('vue').Ref<Record<string, import('../../../../servers/server/models/stack').Environment>[]>} */
const environments = ref([])
onMounted(async () => {
  Socket.on('reloadEnvironments', reload)
  reload()

})
onBeforeUnmount(() => {
  Socket.off('reloadEnvironments', reload)
})
async function reload() {
  environments.value = await Stack.getEnvironments()
}

async function saveEnvironment(environment) {
  setTimeout(async() => {
    if(environment.default) {
      environments.value.forEach((_environment) => {
        if(_environment.label === environment.label) return
        _environment.default = false
        saveEnvironment(_environment)
      })
    }
    await axios.patch(`/stack/environments/${environment.label}`, environment)
      .then(() => notification.next('success', 'Environment saved'))
      .catch(() => notification.next('success', 'Environment cant be saved'));
  }, 100);
}

async function deleteEnvironment(environment) {
  await axios.delete(`/stack/environments/${environment.label}`, environment)
      .then(() => notification.next('success', 'Environment deleted'))
      .catch(() => notification.next('success', 'Environment cant be deleted'));  
}

</script>

<style lang="scss" scoped>
  label {
    display: inline-block;
  }
  .environment {
    &:first-of-type{
    }
    h3 {
      margin: 0;
      display: flex;
      align-items: center;
    }
  }
  .line, .column {
    display: flex;
    gap: 5px;
  }
  .line {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .column {
    flex-direction: column;
    justify-content: center;
  }

  textarea {
    width: 100%;
    height: 50vh;
  }
</style>
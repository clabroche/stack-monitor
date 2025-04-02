<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Configuration</h2>
      <div class="line">
        <Button size="small" icon="fas fa-copy" label="Duplicate" @click="duplicate"/>
        <Button size="small" icon="fas fa-trash" label="Remove" severity="danger" @click="remove"/>
      </div>
    </div>

    <TabView v-model:activeIndex="activeTabIndex">
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fas fa-home"></i>
            <span style="margin-left: 10px;">General</span>
          </div>
        </template>
        <GeneralTab :service="service" />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fas fa-terminal"></i>
            <span style="margin-left: 10px;">Commands</span>
          </div>
        </template>
        <CommandsTab :service="service" />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fas fa-bolt"></i>
            <span style="margin-left: 10px;">Shortcuts</span>
          </div>
        </template>
        <ShortcutsTab :service="service" />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fas fa-heartbeat"></i>
            <span style="margin-left: 10px;">Health Check</span>
          </div>
        </template>
        <HealthCheckTab :service="service" />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fab fa-docker"></i>
            <span style="margin-left: 10px;">Docker</span>
          </div>
        </template>
        <DockerTab :service="service" />
      </TabPanel>
      <TabPanel>
        <template #header>
          <div style="display: flex; align-items: center;">
            <i class="fas fa-cog"></i>
            <span style="margin-left: 10px;">Environment</span>
          </div>
        </template>
        <EnvTab :service="service" />
      </TabPanel>
    </TabView>

  </section-cmp>
  <ModalEditEnvs ref="modalEditEnvsRef" :service="service"></ModalEditEnvs>
  <Modal ref="modalShowEnvRef" :no-cancel="true" validateString="Close" :maxHeight="'80vh'" :noScroll="false">
      <template>
      </template>
      <template #body="{data: envs}">
        <div v-if="envs">
          <div class="line">
            <h2>Current environment</h2>
            <Button label="Download" icon="fas fa-download" size="small" @click="exportEnv(envs)"/>
          </div>
          <DataTable scrollable class="datatable" size="small"  sortField="key" :sortOrder="1"
            :value="parseRawEnvs(envs)"
            tableStyle="width: 100%;">
            <Column field="key" header="Key" col></Column>
            <Column field="value" header="Value" col></Column>
          </DataTable>
        </div>
      </template>
  </Modal>
  <Modal
  ref="duplicateModalRef"
  cancelString="Cancel"
  validateString="Duplicate"
  :disabled="duplicateModalDisabled">
    <template #header>
        Duplication
      </template>
      <template #body>
        <IftaLabel>
          <InputText size="small" fluid v-model="labelOfDuplicatedService"></InputText>
          <label>Name of the duplicated service</label>
        </IftaLabel>
      </template>
  </Modal>
  <Modal
  ref="removeModalRef"
  cancelString="Cancel"
  validateString="Remove">
    <template #header>
        Remove
      </template>
      <template #body>
        <IftaLabel>
          Are you sure to delete this service ?
        </IftaLabel>
      </template>
  </Modal>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Tree from 'primevue/tree';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import IftaLabel from 'primevue/iftalabel';
import ToggleSwitch from 'primevue/toggleswitch';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { v4 as uuid } from 'uuid';
import { Form, FormField } from '@primevue/forms';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Service from '../../../../fronts/app/src/models/service';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';
import Modal from '../../../../fronts/app/src/components/Modal.vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';
import ModalEditEnvs from './ModalEditEnvs.vue';
import stack from '../../../../fronts/app/src/models/stack';
import Parsers from '../../../../fronts/app/src/models/Parsers';
import CommandsTab from './CommandsTab.vue';
import GeneralTab from './GeneralTab.vue';
import ShortcutsTab from './ShortcutsTab.vue';
import DockerTab from './DockerTab.vue';
import EnvTab from './EnvTab.vue';
import HealthCheckTab from './HealthCheckTab.vue';

export default {
  components: {
    sectionCmp: SectionVue,
    ModalEditEnvs,
    Tree,
    IftaLabel,
    Form,
    Button,
    InputText,
    FormField,
    Modal,
    DataTable,
    Column,
    Select,
    Textarea,
    ToggleSwitch,
    InputGroup,
    InputGroupAddon,
    CommandsTab,
    GeneralTab,
    ShortcutsTab,
    DockerTab,
    EnvTab,
    HealthCheckTab,
    TabView,
    TabPanel
  },
  props: {
    service: {
      /** @type {import('../../../../fronts/app/src/models/service').default | null} */
      default: null,
      required: true,
      type: Service,
    },
  },
  setup(props) {
    const modalEditEnvsRef = ref();
    const modalShowEnvRef = ref();
    const currentEnvironment = ref();
    const router = useRouter();
    const parsers = ref([]);
    const save = () => {
      props.service.save()
        .then(() => notification.next('success', 'Configuration saved'))
        .catch(() => notification.next('error', 'Cannot save configuration'));
    };
    function reorder(arr, index) {
      return [
        {icon: 'fas fa-chevron-up', disabled: index ===0,  action() {
          const [el] = arr.splice(index, 1)
          arr.splice(index - 1 , 0, el)
          save();
        }},
        {icon: 'fas fa-chevron-down', disabled: (index ===(arr?.length || 0) - 1), action() {
          const [el] = arr.splice(index, 1)
          arr.splice(index + 1 , 0, el)
          save();
        }},
      ]
    }
    const activeTabIndex = ref(0);

    onMounted(async () => {
      currentEnvironment.value = await stack.getEnvironment();
      parsers.value = await Parsers.all();
    });
    async function editEnvForCommand() {
      const result = await modalEditEnvsRef.value.open();
      if (result) return save();
      return null;
    }
    async function exportEnv(envObject) {
      const envString = Object.keys(envObject).map((key) => `${key}=${envObject[key]}`).join('\n');
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(envString)}`);
      element.setAttribute('download', '.env');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    function parseRawEnvs(envs) {
      return Object.keys(envs).map((key) => ({ key, value: envs[key] }));
    }
    const removeModalRef = ref();
    const duplicateModalRef = ref();
    const labelOfDuplicatedService = ref('');
    return {
      duplicateModalRef,
      labelOfDuplicatedService,
      modalEditEnvsRef,
      modalShowEnvRef,
      exportEnv,
      parseRawEnvs,
      activeTabIndex,
      removeModalRef,
      save,
      duplicateModalDisabled: computed(() => !labelOfDuplicatedService.value
          || stack.services.value.find((a) => a.label === labelOfDuplicatedService.value)),
      async remove() {
        const result = await removeModalRef.value.open().promise;
        if (!result) return;
        axios.delete(`/stack/${props.service.label}`)
          .then(() => {
            notification.next('success', 'Service supprimé');
            router.push({ name: 'stack-single-no-view' });
          });
      },
      async duplicate() {
        const result = await duplicateModalRef.value.open().promise;
        if (!result) return;

        axios.put(`/stack/${props.service.label}/duplicate`, { label: labelOfDuplicatedService.value })
          .then(() => {
            notification.next('success', 'Service duplicated');
            const label = labelOfDuplicatedService.value;
            router.push({ name: 'stack-single', params: { label }, query: { tab: 'Configuration' } });
          })
          .catch(() => {
            notification.next('error', 'Cant duplicate service');
          }).finally(() => {
            labelOfDuplicatedService.value = '';
          });
      },
    };
  },
};
</script>

<style lang="scss" scoped>
$grey: var(--system-border-borderColor);
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
  }
  input {
    height: max-content;
  }
}
.line {
  display: flex;
  align-items: center;
}
.label {
  white-space: nowrap;
  display: flex;
  text-overflow: ellipsis;
  overflow: hidden;
  flex-wrap: wrap;
  align-items: center;
  .actions {
    display: flex;
    align-items: center;
    :deep(button) {
      padding: 0;
      width: 25px;
      height: 25px;
    }
  }
  i {
    margin-left: 5px;
    font-size: 12px;
    position: relative;
    vertical-align:super;
    text-decoration:none;
  }
}

/* Tab panel icons spacing */
:deep(.p-tabview-nav li .p-tabview-nav-link i) {
  margin-right: 10px;
}

.description {
  color: var(--system-tertiary-color);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: inline-block;
}
.column {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.line {
  display: flex;
  justify-content: space-between;
}
::v-deep {
  .p-tree-node-label {
    flex-grow: 1;
    overflow: hidden;
  }
  .p-tree-node-children {
    padding: 0 30px
  }
}

.editable-input {
  position: relative;
  width: 100%;
  
  &.fluid {
    width: 100%;
  }
  
  .editable-display {
    display: flex;
    align-items: center;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    min-height: 30px;
    cursor: pointer;
    
    &:hover {
      background-color: var(--system-neutral-03);
      border-color: var(--system-border-borderColor);
      
      .edit-button {
        opacity: 1;
      }
    }
    
    span.placeholder {
      color: #999;
      font-style: italic;
    }
    
    .edit-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0.3;
      margin-left: auto;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: opacity 0.2s;
      
      i {
        font-size: 12px;
        color: var(--text-color);
      }
    }
  }
  
  .editable-field {
    width: 100%;
    
    .editable-input-field {
      width: 100%;
      padding: 5px 8px;
      border: 1px solid var(--primary-color);
      border-radius: 4px;
      outline: none;
      
      &:focus {
        box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
      }
    }
  }
}
</style>

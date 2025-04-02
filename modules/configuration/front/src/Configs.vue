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

    <Tabs v-model:value="activeTabIndex" scrollable>
      <TabList>
        <Tab v-for="(tab, index) in tabs" :key="index" :value="index">
          <div style="display: flex; align-items: center;">
            <i :class="tab.icon"></i>
            <span style="margin-left: 10px;">{{ tab.label }}</span>
          </div>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel :value="0">
          <GeneralTab :service="service" />
        </TabPanel>
        <TabPanel :value="1">
          <CommandsTab :service="service" />
        </TabPanel>
        <TabPanel :value="2">
          <ShortcutsTab :service="service" />
        </TabPanel>
        <TabPanel :value="3">
          <HealthCheckTab :service="service" />
        </TabPanel>
        <TabPanel :value="4">
          <DockerTab :service="service" />
        </TabPanel>
        <TabPanel :value="5">
          <EnvTab :service="service" />
        </TabPanel>
      </TabPanels>
    </Tabs>

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
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
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
    Tabs,
    TabList,
    Tab,
    TabPanels,
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
    const activeTabIndex = ref(0);
    const tabs = ref([
      { label: 'General', icon: 'fas fa-home' },
      { label: 'Commands', icon: 'fas fa-terminal' },
      { label: 'Shortcuts', icon: 'fas fa-bolt' },
      { label: 'Health Check', icon: 'fas fa-heartbeat' },
      { label: 'Docker', icon: 'fab fa-docker' },
      { label: 'Environment', icon: 'fas fa-cog' }
    ]);
    
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
      tabs,
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
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
  }
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(button:hover) {
  background: initial;
  color: var(--system-accent-backgroundColor1-darkest);
}

:deep(button) {
  border: 0;
}
</style>

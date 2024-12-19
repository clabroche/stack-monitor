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
      <Divider v-if="environments[i+1]"></Divider>
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
  }

  .column {
    flex-direction: column;
    justify-content: center;
  }
</style>
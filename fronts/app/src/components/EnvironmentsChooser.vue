<template>
  <div class="banner" v-if="currentEnvironment" :style="{
    backgroundColor: currentEnvironment.bgColor || 'transparent',
    color: currentEnvironment.color || 'transparent',
  }">
    <div>
      Current environment
      <Select
          size="small"
          :defaultValue="currentEnvironment.label"
          :value="currentEnvironment.label"
          @change="changeEnvironment"
          :options="environments.filter(a => a)"
          optionLabel="label"
          optionValue="label"
          placeholder="Select an environment">
          <template #footer>
            <Button label="Add New" fluid severity="secondary" text size="small" icon="fas fa-plus" @click="createEnvironment"/>
            <Button label="Edit" fluid severity="secondary" text size="small" icon="fas fa-edit" @click="editEnvironments"/>
          </template>
        </Select>
    </div>
  </div>
  <Teleport to="body" v-if="loading">
    <div class="reload-modal">
      <Spinner></Spinner>
      Change environments...
    </div>
  </Teleport>
  <Modal ref="overrideModalRef" cancelString="Cancel" validateString="Ok">
    <template #header="{data: services}">
      Change environment
    </template>
    <template #body="{data: services}">
      Because .env in services root folder is the main truth. Some environments may not be taken into account.
      <ul>
        <li v-for="service of services" :key="service.id">
          {{service.label}}
          <ul>
            <li v-for="(env, key) of service.spawnOptions.overrideEnvs">
              {{key}}: {{env}}
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </Modal>

  <Modal ref="createEnvironmentModalRef" cancelString="Cancel" validateString="Ok">
    <template #header>
      Create environment
    </template>
    <template #body>
      <IftaLabel>
        <InputText size="small" v-model="environmentToCreate.label" fluid></InputText>
        <label>Label</label>
      </IftaLabel>
      <IftaLabel>
        <InputText size="small" v-model="environmentToCreate.bgColor" fluid></InputText>
        <label>Background color</label>
      </IftaLabel>
      <IftaLabel>
        <InputText size="small" v-model="environmentToCreate.color" fluid></InputText>
        <label>Color</label>
      </IftaLabel>
    </template>
  </Modal>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Stack from '../models/stack'
import notification from '../helpers/notification'
import Spinner from './Spinner.vue';
import Modal from '../components/Modal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Socket from '../helpers/Socket';
import IftaLabel from 'primevue/iftalabel';
import Select from 'primevue/select';
import { useRouter } from 'vue-router';
const router = useRouter()

/** @type {import('vue').Ref<import('../../../../servers/server/models/stack').Environment | null>} */
const currentEnvironment = ref(null)
/** @type {import('vue').Ref<Record<string, import('../../../../servers/server/models/stack').Environment>[]>} */
const environments = ref([])
const loading = ref(false)
/** @type {import('vue').Ref<InstanceType<typeof import('../components/Modal.vue')['default']> | null>} */
const overrideModalRef = ref(null)
/** @type {import('vue').Ref<InstanceType<typeof import('../components/Modal.vue')['default']> | null>} */
const createEnvironmentModalRef = ref(null)
const environmentToCreate = ref({label: '', color: '', bgColor: ''})
onMounted(reload)
async function reload() {
  currentEnvironment.value = await Stack.getEnvironment()
  environments.value = await Stack.getEnvironments()
}
onMounted(() => {
  Socket.on('reloadEnvironments', reload)
})
onBeforeUnmount(() => {
  Socket.off('reloadEnvironments', reload)
})

async function createEnvironment() {
  const result = await createEnvironmentModalRef.value?.open().promise
  if(!result) return 
  if(!environmentToCreate.value?.label) return
  await Stack.createEnvironment(environmentToCreate.value)
  environmentToCreate.value = {label: '', color: '', bgColor: ''}
} 
function getOverridedEnvsServices () {
  return Stack.services.value?.filter(s => s.enabled).reduce((/**@type {import('../models/service').default[]}*/agg, service) => {
    const overrideEnvs = Object.keys(service?.spawnOptions?.overrideEnvs || {})
    const envs = Object.keys(service?.spawnOptions?.env || {})
    if(envs.some((key => overrideEnvs.includes(key)))) {
      agg.push(service)
    }
    return agg
  }, [])
}
async function changeEnvironment({value: env}) {
  const servicesOverrided = getOverridedEnvsServices()
  if(servicesOverrided?.length && overrideModalRef.value) {
    const res = await overrideModalRef.value.open(servicesOverrided).promise
    if(!res) return 
  }
  loading.value = true
  await Stack.changeEnvironment(env)
    .then(() => {
      window.location.reload()
    })
    .catch(err => {
      console.error(err)
      notification.next('error', 'Problem has occured')
    })
    .finally(() => {
      loading.value = false
    })
}
function editEnvironments() {
  router.push({name: 'settings', params: {setting: 'environments'}})

}
</script>

<style lang="scss" scoped>
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
  position: relative;
  z-index: 10;
}

.reload-modal {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
  color: #0076bc;
  background-color: rgba(255,255,255,0.5);
}
.line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
<template>
  <div class="git-section">
    <h1>Git</h1>
    <section-cmp class="section" v-if="servicesToPull?.length || checkUpdatePending" :actions="[
      {id: 'pull-all', label: 'Pull all', click: pullAll, hidden: checkUpdatePending}
    ]">
      <template #header>
        <div class="custom-header">
          Services to pull
          <div class="loader" v-if="checkUpdatePending">
            <i class="fas fa-spinner"></i>
            {{nbServiceChecked}}/{{ services?.length }}
          </div>
        </div>
      </template>
      <table>
        <tr v-for="service of servicesToPull" :key="service?.label">
          <td><h3>{{ service.label }}</h3></td>
          <td><div class="badge">{{ service.git.currentBranch }}</div></td>
          <td>
            <button @click="pull(service)" :disabled="checkUpdatePending || service.git.status?.length">
              <i class="fas fa-download"></i>
              {{ 'Pull ' + '(' + (service.git.delta || 0) + ')' }}
            </button>
          </td>
          <td>
            <div class="line">
              <div v-if="service.git.status?.length">
                <i class="fas fa-exclamation-triangle"></i>
                Pending changes... Pull may not work. Stash or reset your changes before.
              </div>
              <button class="small" :disabled="checkUpdatePending || service.git?.status?.filter(a => a).length" @click="stash(service)">
                <i class="fas fa-sun"></i>
                Stash
              </button>
              <button class="small" :disabled="checkUpdatePending || service.git.stash" @click="stashPop(service)">
                <i class="far fa-sun"></i>
                Unstash
              </button>
            </div>
          </td>
        </tr>
      </table>
    </section-cmp>

    <section-cmp class="section" v-if="servicesToPush?.length || checkUpdatePending">
      <template #header>
        <div class="custom-header">
          Services to push
          <div class="loader" v-if="checkUpdatePending">
            <i class="fas fa-spinner"></i>
            {{nbServiceChecked }}/{{ services?.length }}
          </div>
        </div>
      </template>
      <table>
        <tr v-for="service of servicesToPush" :key="service?.label">
          <td><h3>{{ service.label }}</h3></td>
          <td><div class="badge">{{ service.git.currentBranch }}</div></td>
          <td>
            {{ service.git.delta }} commits to push
          </td>
        </tr>
      </table>
    </section-cmp>

    <section-cmp header="Services">
      Change all branches to:  
      <select @input="changeAllBranches($event.target.value)" :disabled="checkUpdatePending">
        <option default></option>
        <option v-for="branch of allBranches" :key="branch" :value="branch">{{ branch }}</option>
      </select>
      <table>
        <tr v-for="service of services" :key="service?.label">
          <td>
            <h3>
              {{ service.label }}
              <i class="fas fa-external-link-alt" @click="$router.push({name: 'stack-single', params: {label: service.label}})"></i>
            </h3>
          </td>
          <td><div class="badge">{{ service.git.currentBranch }}</div></td>
          <td>
            <select @input="changeBranch(service, $event.target.value)" v-if="service.git?.branches?.filter(a => !a.startsWith('*'))?.length" :disabled="checkUpdatePending">
              <option default></option>
              <option v-for="branch of service.git?.branches?.filter(a => !a.startsWith('*'))" :key="branch" :value="branch">{{ branch }}</option>
            </select>
            <div v-else>
              Unique branch, cannot change branch for this service
            </div>
          </td>
          <td>
            <div class="line">
              <button class="small" :disabled="checkUpdatePending || service.git?.status?.filter(a => a).length" @click="stash(service)">
                <i class="fas fa-sun"></i>
                Stash
              </button>
              <button class="small" :disabled="checkUpdatePending || service.git.stash" @click="stashPop(service)">
                <i class="far fa-sun"></i>
                Unstash
              </button>
            </div>
          </td>
        </tr>
      </table>
    </section-cmp>
  </div>
</template>

<script setup>
import stack from "@/models/stack"
import { computed, onMounted, ref, watch, watchEffect } from "vue"
import SectionCmp from '@/components/Section.vue'
import PromiseB from 'bluebird'
import notification from "@/helpers/notification"

const services = ref(stack.services.sort((a, b) => a.label.localeCompare(b.label)))
const servicesToPull = ref([])
const servicesToPush = ref([])
async function updateGit() {
  const result = await PromiseB.map(stack.services, async(service) => {
    await service.updateGit()
    return service
  }, { concurrency: 6 })
  services.value = result.sort((a,b) => a.label.localeCompare(b.label))
}
onMounted(() => updateGit())
watch(() => stack.services, async() => {
  await updateGit()
}, {deep: true})

const allBranches = computed(() => {
  const array = services.value.flatMap(service => service.git?.branches?.map(branch => branch.replace('*', '').trim()))
  return [...new Set(array)].sort((a,b) => a.localeCompare(b) )
})

const checkUpdatePending = ref(false)
const nbServiceChecked = ref(0)

const checkUpdates = async () => {
  checkUpdatePending.value = true
  nbServiceChecked.value = 0
  servicesToPull.value = []
  servicesToPush.value = []
  await PromiseB.map(stack?.services || [], async (service) => {
    try {
      await service.updateGit()
      const currentBranch = await service.getCurrentBranch()
      service.git.delta = await service.gitRemoteDelta(currentBranch)
      if (service.git.delta < 0) {
        servicesToPull.value.push(service)
      }
      if (service.git.delta > 0) {
        servicesToPush.value.push(service)
      }
      return service
    } catch (error) {
      console.error(error)
    } finally {
      nbServiceChecked.value += 1
    }
  }, { concurrency: 6 })
  .finally(() => {
    checkUpdatePending.value = false
  })
}
onMounted(checkUpdates)

async function pull(service) {
  checkUpdatePending.value = true
  await service.pull()
    .catch(err => notification.next('error', err.response.data))
  await service.updateGit()
  await checkUpdates()
  notification.next('success', `Branch is now up to date`)
}
async function pullAll() {
  checkUpdatePending.value = true
  try {
    await PromiseB.map(servicesToPull.value, async service => {
      await service.pull()
        .catch(err => notification.next('error', err.response.data))
    }, {concurrency: 6})
    await checkUpdates()
    notification.next('success', `All branches are pulled`)
  } catch (error) {
    console.error(error)
  } finally {
    checkUpdatePending.value = false
  }
}

async function changeAllBranches(branchName) {
  if (!branchName) return
  checkUpdatePending.value = true
  await PromiseB.map(services.value, async service => {
    await service.changeBranch(branchName)
      .catch(err => notification.next('error', err.response.data))
  }, { concurrency: 6 })
  await updateGit()
  await checkUpdates()
}

async function changeBranch(service, branchName) {
  if (!branchName) return
  checkUpdatePending.value = true
  await service.changeBranch(branchName)
    .catch(err => notification.next('error', err.response.data))
  await updateGit()
  await checkUpdates()
}
async function stash(service) {
  await service.stash()
    .then(() => notification.next('success', `All changes is in stash`))
    .catch(err => notification.next('error', err.response.data))
  return service.updateGit()
}
async function stashPop(service) {
  await service.stashPop()
    .then(() => notification.next('success', `All changes unstashed`))
    .catch(err => notification.next('error', err.response.data))
  return service.updateGit()
}
</script>

<style lang="scss" scoped>
.git-section {
  overflow: auto;
  height: 100vh;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
.custom-header {
  display: flex;
  gap: 10px;
}
h3, h1 {
  margin: 0;
}
.line {
  display: flex;
  align-items: center;
}
.badge {
  background: #b1b1b1;
  padding: 5px 10px;
  border-radius: 10px;
  color: white;
  box-shadow: 0 0 20px 0 #b1b1b1;
  width: max-content;
}
.section {
  width: 100%;
}
tr {
  transition: 300ms;
  &:hover {
    background-color: rgba(0,0,0, 0.05);
  }
  td {
    text-align: left;
    vertical-align: middle;
  }
}
select {
  width: 100%;
}
button.small {
  width: max-content;
}
.loader {
  i {
    animation: rotation 2s infinite;
  }
}
@keyframes rotation {
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(360deg);
  }
}
</style>
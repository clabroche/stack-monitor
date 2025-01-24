<template>
  <div class="git-section">
    <h1>Git</h1>
    <div class="sections">
      <section-cmp class="section" v-if="servicesToPull?.length || checkUpdatePending" :actions="[
        {label: 'Pull all', icon:'fas fa-download', click: pullAll, hidden: checkUpdatePending}
      ]">
        <template #header>
          <div class="custom-header">
            <div class="loader" v-if="checkUpdatePending">
              <Spinner size="15"></Spinner>
            </div>
            Services to pull
            <div class="loader" v-if="checkUpdatePending">
              ({{nbServiceChecked}}/{{ groups?.length }})
              {{ currentServiceChecking }}
            </div>
          </div>
        </template>
        <table>
          <caption>All services to pull</caption>
          <tr v-for="services of servicesToPull" :key="services[0].label">
            <td>
              <template v-for="service of services">
                <h3>{{ service.label }}
                <i class="fas fa-external-link-alt" @click="router.push({
                  name: 'stack-single', params: {label: service.label}
                })"></i></h3>
              </template>
            </td>
            <td><div class="badge">{{ services[0].git?.currentBranch }}</div></td>
            <td>
              <button @click="pull(services[0])" :disabled="checkUpdatePending || !!services[0].git?.status?.length">
                <i class="fas fa-download"></i>
                {{ 'Pull ' + '(' + (services[0].git?.delta || 0) + ')' }}
              </button>
            </td>
            <td>
              <div class="line" v-if="services[0].git">
                <div v-if="services[0].git.status?.length">
                  <i class="fas fa-exclamation-triangle"></i>
                  Pending changes... Pull may not work. Stash or reset your changes before.
                </div>
                <button class="small" :disabled="checkUpdatePending || !services[0].git?.status?.filter(a => a).length"
                  @click="stash(services[0])">
                  <i class="fas fa-sun"></i>
                  Stash
                </button>
                <button class="small" :disabled="checkUpdatePending || !services[0].git.stash" @click="stashPop(services[0])">
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
            <div class="loader" v-if="checkUpdatePending">
              <Spinner size="15"></Spinner>
            </div>
            Services to push
            <div class="loader" v-if="checkUpdatePending">
              ({{nbServiceChecked }}/{{ groups?.length }})
            </div>
          </div>
        </template>
        <table>

          <caption>All services to push</caption>
          <tr v-for="services of servicesToPush" :key="services[0]?.label">
            <td>
              <template v-for="service of services">
                <h3>{{ service.label }}
                <i class="fas fa-external-link-alt" @click="router.push({
                  name: 'stack-single', params: {label: service.label}
                })"></i></h3>
              </template>
            </td>
            <td><div class="badge">{{ services[0].git?.currentBranch }}</div></td>
            <td>
              <template v-if="servicesWithError[services[0].label] === 'BRANCH_TO_PUSH'">
                Branch not on remote
              </template>
              <template v-else>
                {{ services[0].git?.delta }} commits to push
              </template>
            </td>
          </tr>
        </table>
      </section-cmp>

      <section-cmp header="Services">
        Change all branches to:
        <select @input="// @ts-ignore
                        changeAllBranches($event?.target?.value ||'')" :disabled="checkUpdatePending">
          <option default></option>
          <option v-for="branch of allBranches" :key="branch?.name" :value="branch?.name">{{ branch?.name }}</option>
        </select>
        <table>
          <caption>Manage all services</caption>
          <tr v-for="service of services.filter(s => s.git?.currentBranch)" :key="service?.label">
             <td>
              <h3>
                {{ service.label }}
                <i class="fas fa-external-link-alt" @click="router.push({
                  name: 'stack-single', params: {label: service.label}
                })"></i>
              </h3>
            </td>
            <template v-if="servicesWithError[service.label] && servicesWithError[service.label] !== 'BRANCH_TO_PUSH'">
              <td colspan="3">
                {{ servicesWithError[service.label] }}
              </td>
            </template>
            <template v-else>
              <td><div class="badge">{{ service.git?.currentBranch }}</div></td>
              <td>
                <select @input="changeBranch(// @ts-ignore
                  service, $event.target.value)"
                  v-if="service.git?.branches?.filter(a => a?.name !== service.git?.currentBranch)?.length"
                  :disabled="checkUpdatePending">
                  <option default></option>
                  <option v-for="branch of service.git?.branches?.filter(a => a?.name !== service.git?.currentBranch)"
                    :key="branch?.name" :value="branch?.name">{{ branch?.name }}</option>
                </select>
                <div v-else>
                  Unique branch, cannot change branch for this service
                </div>
              </td>
              <td>
                <div class="line">
                  <button class="small" :disabled="checkUpdatePending || !service.git?.status?.filter(a => a).length"
                    @click="stash(service)">
                    <i class="fas fa-sun"></i>
                    Stash
                  </button>
                  <button class="small" :disabled="checkUpdatePending || !service.git?.stash" @click="stashPop(service)">
                    <i class="far fa-sun"></i>
                    Unstash
                  </button>
                </div>
              </td>
            </template>
          </tr>
        </table>
      </section-cmp>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PromiseB from 'bluebird';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import stack from '../../../../fronts/app/src/models/stack';
import notification from '../../../../fronts/app/src/helpers/notification';
import Spinner from '../../../../fronts/app/src/components/Spinner.vue';

const router = useRouter();

/** @type {import('vue').Ref<import('../../../../fronts/app/src/models/service').default[]>} */
const services = ref(stack.services.value.sort((a, b) => a.label?.localeCompare(b?.label || '') || 0));
/** @type {import('vue').Ref<import('../../../../fronts/app/src/models/service').default[][]>} */
const servicesToPull = ref([]);
/** @type {import('vue').Ref<import('../../../../fronts/app/src/models/service').default[][]>} */
const servicesToPush = ref([]);
/** @type {import('vue').Ref<{[key: string]: string}>} */
const servicesWithError = ref({});
async function updateGit() {
  const result = await PromiseB.map(stack.services.value, async (service) => {
    await service.updateGit();
    return service;
  }, { concurrency: 6 });
  services.value = result.sort((a, b) => a.label?.localeCompare(b?.label || '') || 0);
}
onMounted(async () => {
  await stack.loadServices();
  await updateGit();
  await checkUpdates();
});
/**
 * @param {*[]} arr
 * @param {string[]} properties
 */
const getUniqueItemsByProperties = (arr, properties) => (
  arr.filter((v, i, a) => a.findIndex((v2) => properties.every((k) => v2[k] === v[k])) === i)
);

const allBranches = computed(() => {
  const array = services.value.flatMap((service) => service.git?.branches).filter((a) => a);
  return getUniqueItemsByProperties(array, ['name']).sort((a, b) => a?.name?.localeCompare(b?.name));
});

const checkUpdatePending = ref(false);
const nbServiceChecked = ref(0);
const currentServiceChecking = ref('');

const groups = computed(() => {
  /**
   * @type {{[key: string]: import('../../../../fronts/app/src/models/service').default[]}}
   */
  const record = (stack?.services.value || []).reduce((agg, service) => {
    if(!agg[service.rootPath]) agg[service.rootPath] = []
    agg[service.rootPath].push(service)
    return agg
  }, {})
  console.log(record)
  return Object.keys(record).map(rootPath => ({
    rootPath, services: record[rootPath]
  }))
})

const checkUpdates = async () => {
  checkUpdatePending.value = true;
  nbServiceChecked.value = 0;
  currentServiceChecking.value = '';
  servicesToPull.value = [];
  servicesToPush.value = [];
  servicesWithError.value = {}
  console.log(groups.value)
  await PromiseB.map(groups.value, async ({rootPath, services}) => {
    console.log(services)
    const [service] = services
    try {
      currentServiceChecking.value = service.label || '';
      await service.updateGit();
      const currentBranch = await service.getCurrentBranch().catch(err => {
        servicesWithError.value[service.label] = err.response.data?.message
        throw err
      });
      if (service.git && currentBranch) {
        service.git.delta = await service.gitRemoteDelta(currentBranch).catch(err => {
          if(err.response.data?.code === 500.12578) {
            servicesToPush.value.push(services)
            servicesWithError.value[service.label] = 'BRANCH_TO_PUSH'
          } else {
            servicesWithError.value[service.label] = err.response.data?.message
          }
          throw err
        });
        if (service.git.delta) {
          if (service.git.delta < 0) {
            servicesToPull.value.push(services);
          }
          if (service.git.delta > 0) {
            servicesToPush.value.push(services);
          }
        }
      }
      return service;
    } catch (error) {
      console.error(error);
    } finally {
      nbServiceChecked.value += 1;
    }
    return null;
  }, { concurrency: 6 })
    .finally(() => {
      checkUpdatePending.value = false;
      currentServiceChecking.value = '';
    });
};

/** @param {import('../../../../fronts/app/src/models/service').default} service */
async function pull(service) {
  checkUpdatePending.value = true;
  await service.pull()
    .catch((err) => notification.next('error', err.response.data));
  await service.updateGit();
  await checkUpdates();
  notification.next('success', 'Branch is now up to date');
}
async function pullAll() {
  checkUpdatePending.value = true;
  try {
    await PromiseB.map(servicesToPull.value, async (services) => {
      await services[0].pull()
        .catch((err) => notification.next('error', err.response.data));
    }, { concurrency: 6 });
    await checkUpdates();
    notification.next('success', 'All branches are pulled');
  } catch (error) {
    console.error(error);
  } finally {
    checkUpdatePending.value = false;
  }
}

/** @param {string} branchName */
async function changeAllBranches(branchName) {
  if (!branchName) return;
  checkUpdatePending.value = true;
  await PromiseB.map(services.value, async (service) => {
    await service.changeBranch(branchName)
      .catch((err) => notification.next('error', err.response.data));
  }, { concurrency: 6 });
  await updateGit();
  await checkUpdates();
}

/**
 * @param {import('../../../../fronts/app/src/models/service').default} service
 * @param {string} branchName
*/
async function changeBranch(service, branchName) {
  if (!branchName) return;
  checkUpdatePending.value = true;
  await service.changeBranch(branchName)
    .catch((err) => notification.next('error', err.response.data));
  await updateGit();
  await checkUpdates();
}
/** @param {import('../../../../fronts/app/src/models/service').default} service */
async function stash(service) {
  await service.stash()
    .then(() => notification.next('success', 'All changes is in stash'))
    .catch((err) => notification.next('error', err.response.data));
  return service.updateGit();
}
/** @param {import('../../../../fronts/app/src/models/service').default} service */
async function stashPop(service) {
  await service.stashPop()
    .then(() => notification.next('success', 'All changes unstashed'))
    .catch((err) => notification.next('error', err.response.data));
  return service.updateGit();
}
</script>

<style lang="scss" scoped>
.git-section {
  overflow: auto;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.custom-header {
  display: flex;
  gap: 10px;
}
table {
  caption {
    display: none;
  }
}
h3, h1 {
  margin: 0;
}
h3 {
  i {
    cursor: pointer;
  }
}
.line {
  display: flex;
  align-items: center;
}
.badge {
  background: var(--git-badge-backgroundColor);
  color: var(--git-badge-color);
  padding: 5px 10px;
  border-radius: 10px;
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
  background-color: var(--system-secondary-backgroundColor);
  color: var(--system-secondary-color);
}
button.small {
  width: max-content;
}
.loader {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>

<template>
  <div class="git-root">
    <div class="git-section" v-if="service.git">
      <section-cmp v-if="git && git.branches" class="section-branches"
        :key="service.label"
        header="Branches"
        :noStyle="noStyle"
        :actions="[
          { hover: 'Create branch', label: '', click: () => addBranch(), icon: 'fas fa-plus', small: true },
          { hover: 'Fetch all', label: '', click: () => gitFetch(), icon: 'fas fa-sync' },
          {
            hover: 'Pull',
            label: pullLabel,
            hidden: git.delta != null && git.delta >= 0,
            click: () => pull(),
            icon: 'fas fa-download'
          }
        ]">
        <div>
          <input type="text" placeholder="Search branch..." v-model="searchBranch">
        </div>
        <div>
          <input type="checkbox" v-model="displayOnlyLocalBranches">
          Display only local branches
        </div>
        <ul class="branches">
          <li v-for="(branch, i) of displayBranches" :key="'branch' +i"
            @click="branch?.name ? changeBranch(branch.name) : null" :class="{
            active: branch?.name === service?.git?.currentBranch,
            merged: branch?.merged
          }">
            <div class="actions">
              <div v-if="branch?.merged" title="Already merged into develop">
                <i class="fas fa-object-group" aria-hidden="true"></i>
              </div>
              <div v-if="branch?.isRemote" title="Is in remote not local">
                <i class="fas fa-cloud-download-alt" aria-hidden="true"></i>
              </div>
              {{branch?.name}}
            </div>
            <div class="actions">
              <button class="small" @click.stop="branch?.name ? deleteBranch(branch.name) : null" v-if="branch.canDelete">
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </li>
        </ul>
      </section-cmp>
      <section-cmp v-if="git?.status" class="section-status" header="Status" :noStyle="noStyle" :animateActions="true" :actions="[
        {small: true, hover: 'Stash', click: () => stash(), icon: 'fas fa-sun',hidden: !git.status.filter(a =>a).length},
        {small: true, hover: 'Unstash', click: () => stashPop(), icon: 'far fa-sun', hidden: !git.stash},
        {small: true, hover: 'Reset', click: () => reset(), icon: 'fas fa-eraser'},
        {small: true, hover: 'Review from AI', click: () => openReview(), icon: 'fas fa-brain'}
        ]">
        <ul v-if="git.status.filter(a =>a).length">
          <li v-for="(status, i) of git.status" :key="'status-' + i">
            <span v-html="colorStatus(status)"></span>
            <div class="actions">
              <i class="fas fa-external-link-alt" aria-hidden="true" @click.stop="openInVsCode(status)"></i>
              <i class="fas fa-times" aria-hidden="true" @click.stop="checkoutFile(status)"></i>
            </div>
          </li>
        </ul>
        <div v-else class="check">
          <i class="fas fa-check" aria-hidden="true"></i>
        </div>
      </section-cmp>
    </div>
    <div class="loader" v-if="loader">
      <i class="fas fa-spinner"></i>
    </div>
    <section-cmp class="section-history">
      <div>
        Display all branches:
        <input type="checkbox" v-model="graphOnAll" @change="updateGraph">
      </div>
      <div class="input-container">
        <i class="fas fa-search"></i>
        <input type="text" v-model="search" placeholder="Search..." @keypress.enter="nextSearch">
        <div>
          <button @click="previousSearch"><i class="fas fa-chevron-up"></i></button>
          <button @click="nextSearch"><i class="fas fa-chevron-down"></i></button>
        </div>
      </div>
      <div ref="terminalRef"></div>
    </section-cmp>
  </div>

  <modal ref="resetModal" cancelString="No" validateString="Yes">
    <template #header>
      Reset
    </template>
    <template #body>
      Do you really want to launch "git reset --hard" on this repository ?
    </template>
  </modal>
  <modal ref="checkoutModal" cancelString="No" validateString="Yes">
    <template #header>
      Checkout
    </template>
    <template #body="{data: file}">
      Do you really want to launch "git checkout {{file}}" on this repository ?
    </template>
  </modal>
  <modal ref="branchModal" cancelString="No" validateString="Yes">
    <template #header>
      Branch change
    </template>
    <template #body="{data:branchName}">
      Do you really want to change branch to "{{branchName}}" on this repository ?
    </template>
  </modal>
  <modal ref="addBranchModal" cancelString="Cancel" validateString="Validate">
    <template #header>
      Add Branch
    </template>
    <template #body="{data:model}">
      <input type="text" v-model="model.name" placeholder="Name of branch">
      <div>
        <input type="checkbox" v-model="model.shouldPush" placeholder="Name of branch">
        Push this branch after creation ?
      </div>
    </template>
  </modal>
    <modal ref="branchDeleteModal" cancelString="No" validateString="Yes">
    <template #header>
      Branch delete
    </template>
    <template #body="{data:branchName}">
      Do you really want to delete branch "{{branchName}}" on this repository ?
    </template>
  </modal>
  <modal ref="reviewModal" cancelString="No" validateString="Yes">
    <template #header>
      Review from AI
    </template>
    <template #body="{data: tokens}">
      Are you sure ? This have a cost of ~{{ tokens.price }}$
    </template>
  </modal>

  <modal ref="reviewResult" cancelString="OK" :noValidate="true">
    <template #header>
      Review from AI
    </template>
    <template #body="{data: result}">
      <pre>
        {{result?.trim()}}
      </pre>
    </template>
  </modal>
</template>

<script setup>
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { CanvasAddon } from 'xterm-addon-canvas';
import { SearchAddon } from 'xterm-addon-search';
import notification from '../../../../fronts/app/src/helpers/notification';
import Service from '../../../../fronts/app/src/models/service';
import modal from '../../../../fronts/app/src/components/Modal.vue';
import sectionCmp from '../../../../fronts/app/src/components/Section.vue';
import Theme from '../../../../fronts/app/src/helpers/Theme';
import { useCurrentEditor } from '../../../../fronts/app/src/models/currentEditor';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  noStyle: { default: false },
  customGit: { default: null },
  service: {
    /** @type {import('../../../../fronts/app/src/models/service').default | null} */
    default: null,
    required: true,
    type: Service,
  },
})

const {
  currentEditor
} = useCurrentEditor(props.service)

/** @type {import('vue').Ref<number | null>} */
const interval = ref(null)
/** @type {import('vue').Ref<number | null>} */
const longInterval = ref(null)
/** @type {import('vue').Ref<import('xterm').Terminal | null>} */
const terminal = ref(null)
const loader = ref(false)
const graphOnAll = ref(false)
/** @type {import('vue').Ref<string | null>} */
const defaultBranch = ref(null)
const search = ref('')
/** @type {import('vue').Ref<import('xterm-addon-search').SearchAddon | null>} */
const terminalSearch = ref(null)
const displayOnlyLocalBranches = ref(true)
const searchBranch = ref('')
const observable = ref(null)

const git = computed(() => {
  return props.service.git;
})
/** @return {string} */
const pullLabel = computed(() => {
  if (git.value?.delta == null) return 'Refresh...';
  return `Pull (${git.value.delta || 0})`;
})
const displayBranches = computed(() => {
  return (git.value?.branches || [])
    .filter((branch) => branch.name.toUpperCase().includes(searchBranch.value.toUpperCase()))
    .filter((branch) => {
      if (displayOnlyLocalBranches.value) return !branch.isRemote;
      return true;
    });
})
const terminalRef = ref()
onMounted(async () => {
 if (props.customGit) return;
  const commandRef = /** @type {HTMLElement} */(terminalRef.value);
  if (!commandRef) return;
  // @ts-ignore
  interval.value = setInterval(() => props.service.updateGit(), 1000);
  // @ts-ignore
  longInterval.value = setInterval(() => gitFetch(), 1000 * 60);
  await props.service.updateGit();
  if (!defaultBranch.value) {
    const branchNames = props.service.git?.branches?.map((/** @type {*} */a) => a.name) || [];
    if (branchNames.includes('develop')) defaultBranch.value = 'develop';
    else if (branchNames.includes('dev')) defaultBranch.value = 'dev';
    else if (branchNames.includes('master')) defaultBranch.value = 'master';
    else if (branchNames.includes('main')) defaultBranch.value = 'main';
  }
  await loadTerminal();

  observable.value = Theme.observableCurrentTheme.subscribe(async () => {
    loadTerminal();
    await updateGraph();
    await gitFetch();
  });
  await updateGraph();
  await gitFetch();
})

onBeforeUnmount(() => {
  clearInterval(interval.value || undefined);
  clearInterval(longInterval.value || undefined);
  observable.value?.unsubscribe?.();
})
function loadTerminal() {
  const commandRef = /** @type {HTMLElement} */(terminalRef.value);
  if (!commandRef) return;
  commandRef.innerHTML = '';
  terminal.value = new Terminal({
    smoothScrollDuration: 100,
    fontFamily: 'MesloLGS NF, monospace',
    convertEol: true,
    disableStdin: true,
    fontSize: 13,
    allowTransparency: true,
    minimumContrastRatio: Theme.get('system.terminal/contrastRatio'),
    theme: {
      background: Theme.get('system.terminal/backgroundColor'),
      foreground: Theme.get('system.terminal/color'),
      selectionBackground: '#1d95db',
      selectionForeground: 'white',
    },
  });
  const fitAddon = new FitAddon();
  if (terminal.value) {
    terminal.value.loadAddon(fitAddon);
    terminal.value.loadAddon(new CanvasAddon());
    const searchAddon = new SearchAddon();
    terminalSearch.value = searchAddon;
    terminal.value.loadAddon(searchAddon);
    terminal.value.open(commandRef);
    fitAddon.activate(terminal.value);
    fitAddon.fit();
  }
}
/** @param {KeyboardEvent | MouseEvent} ev */
async function  nextSearch(ev) {
  if (ev.shiftKey) {
    return previousSearch();
  }
  if (terminalSearch.value) {
    terminalSearch.value.findNext(search.value);
  }
  return null;
}
async function  previousSearch() {
  if (terminalSearch.value) {
    terminalSearch.value.findPrevious(search.value);
  }
}
/** @param {string} line */
function openInVsCode(line) {
  const path = line.trim().split(' ').slice(1).join(' ');
  props.service.openLinkInVsCode(path, currentEditor.value.key);
}
async function gitFetch() {
  try {
    if (!props.service.git) return;
    props.service.git.delta = null;
    await props.service.gitFetch()
      .catch((/** @type {*} */err) => notification.next('error', err?.response?.data || err?.message || err));
    const currentBranch = await props.service.getCurrentBranch();
    if (!currentBranch) return;
    props.service.git.delta = await props.service.gitRemoteDelta(currentBranch);
  } catch (error) {
    console.error(error);
    if (props.service.git) props.service.git.delta = 0;
  }
}

const addBranchModal = ref()
async function addBranch() {
  const model = {
    name: '',
    shouldPush: false,
  };
  // @ts-ignore
  const res = await addBranchModal.value.open(model).promise;
  if (res) {
    if (!model.name) return notification.next('error', 'Branch name cannot be empty');
    await props.service.addBranch(model.name, model.shouldPush);
    if (model.shouldPush) await gitFetch();
  }
  return null;
}

async function updateGraph() {
  const graph = await props.service.getGraph(graphOnAll.value)
    .catch((/** @type {*} */err) => notification.next('error', err?.response?.data || err?.message || err));
  if (graph && terminal.value) {
    terminal.value.clear();
    terminal.value.writeln(graph.join('\n'));
    setTimeout(() => {
      if (!terminal.value) return;
      terminal.value.scrollToTop();
    });
  }
}
/** @param {string} status */
function colorStatus(status) {
  status = status.trim();
  if (status.charAt(0) === 'D') {
    status = `<span style="color: #ff7f7f; font-weight: bold">D</span>${status.slice(1)}`;
  }
  if (status.charAt(0) === 'M') {
    status = `<span style="color: #ffe47f; font-weight: bold">M</span>${status.slice(1)}`;
  }
  if (status.charAt(0) === '?') {
    status = `<span style="color: #7fe1ff; font-weight: bold">??</span>${status.slice(2)}`;
  }
  return status;
}

const branchModal = ref()
/** @param {string} branchName */
async function changeBranch(branchName) {
  loader.value = true;
  try {
    branchName = branchName.trim();
    // @ts-ignore
    const res = await branchModal.value.open(branchName).promise;
    if (res) {
      await props.service.changeBranch(branchName)
        .then(() => notification.next('success', `Branch is now on ${branchName}`))
        .catch((/** @type {*} */err) => notification.next('error', err.response.data));
    }
    updateGraph();
  } catch (error) {

  } finally {
    loader.value = false;
    await props.service.updateGit();
    await gitFetch();
  }
}

const branchDeleteModal = ref()
/** @param {string} branchName */
async function deleteBranch(branchName) {
  loader.value = true;
  try {
    branchName = branchName.trim();
    // @ts-ignore
    const res = await branchDeleteModal.value.open(branchName).promise;
    if (res) {
      await props.service.deleteBranch(branchName)
        .then(() => notification.next('success', `Branch ${branchName} is deleted`))
        .catch((/** @type {*} */err) => notification.next('error', err.response.data));
    }
    await props.service.updateGit();
    updateGraph();
  } catch (error) {

  } finally {
    loader.value = false;
    await props.service.updateGit();
    await gitFetch();
  }
}
const checkoutModal = ref()
/** @param {string} fileStatus */
async function checkoutFile(fileStatus) {
  const file = fileStatus.split(' ').slice(1).join(' ');
  // @ts-ignore
  const res = await checkoutModal.value.open(file).promise;
  if (res) {
    await props.service.checkoutFile(file)
      .then(() => notification.next('success', `Changes on ${file} are deleted`))
      .catch((/** @type {*} */err) => notification.next('error', err.response.data));
    await updateGraph();
  }
}

const resetModal = ref()
async function reset() {
  // @ts-ignore
  const res = await resetModal.value.open().promise;
  if (res) {
    await props.service.reset()
      .then(() => notification.next('success', 'All changes are lost'))
      .catch((/** @type {*} */err) => notification.next('error', err.response.data));
    await updateGraph();
  }
}

const reviewModal = ref()
const reviewResult = ref()
async function openReview() {
  const diff = await props.service.getDiff();
  const tokens = await Service.getTokens(diff);
  // @ts-ignore
  const res = await reviewModal.value.open(tokens).promise;
  if (res) {
    const review = await Service.reviewFromAi(diff);
    // @ts-ignore
    await reviewResult.value.open(review).promise;
  }
}
async function stash() {
  await props.service.stash()
    .then(() => notification.next('success', 'All changes is in stash'))
    .catch((/** @type {*} */err) => notification.next('error', err.response.data));
  return props.service.updateGit();
}
async function stashPop() {
  await props.service.stashPop()
    .then(() => notification.next('success', 'All changes unstashed'))
    .catch((/** @type {*} */err) => notification.next('error', err.response.data));
  return props.service.updateGit();
}
async function pull() {
  await props.service.pull()
    .then(() => notification.next('success', 'Branch is now up to date'))
    .catch((/** @type {*} */err) => notification.next('error', err.response.data));
  await props.service.updateGit();
  await updateGraph();
  await gitFetch();
}
</script>

<style lang="scss" scoped>
.git-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}
button {
  position: relative;
  z-index: 2;
}
.section-branches {
  z-index: 1;
  flex-grow: 1;
  width: auto;
  flex-shrink: 0;
  max-width: 100%;
}
.section-status {
  z-index: 1;
  flex-grow: 2;
  width: auto;
  flex-shrink: 0;
  max-width: 100%;
}
.git-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: stretch;
  margin: auto;
  height: 100%;
  width: 100%;
  flex-grow: 1;
  gap: 20px;
  z-index: 100;
  &>* {
    max-height: 400px;
  }
  .check {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.5em;
    color: green;
  }
  ul {
    margin: 0;
    padding: 0;
    li {
      border-left: 1px solid lightgrey;
      padding: 0;
      padding-left: 10px;
      transition: 300ms;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none;
      margin: 0;
      cursor: pointer;
      .actions {
        display: flex;
        gap: 10px;
      }
      &.active {
        border-left: 3px solid #0076bc;
      }
      button {
        width: max-content;
        transition: 300ms;
        opacity: 0;
        margin: 0 3px
      }
      &:hover {
        background-color: rgba(0,0,0,0.05);
        button {
          opacity: 1;
        }
      }
    }
  }
}
.loader {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 100000;
  backdrop-filter: blur(10px);
  i {
    font-size: 50px;
    animation: rotation 2s infinite linear;
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

.input-container {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    border-radius: 10px;
    padding: 5px;
  }

  button {
    height: auto;
    padding: 5px 10px;
  }
}
</style>

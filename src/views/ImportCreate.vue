<template>
<div class="import-export-root">
  <background-stack-chooser :low-resources="true"/>
  <left-logo/>
  <div class="import-export-container">
    <section-cmp header="Choose configuration" class="section-recent" :actions="[{label: 'Import',  icon: 'fas fa-download', click: () => openModal()}]">
      <div v-for="recent of recents" :key="recent" @click="openPath(recent)" class="recent">
        <i class="fas fa-times" aria-hidden="true" @click.stop="deleteConf(recent)"></i>
        {{recent}}
      </div>
    </section-cmp>
  </div>

  <div class="version">
    {{ System.version.value }}
  </div>
  <div class="tools" @click="$router.push({ name: 'Toolbox' })">
    <i class="fas fa-toolbox"></i>
  </div>
  <modal ref="modalRef" :noActions="true">
    <template #body>
      <explorer @file="openPath"/>
    </template>
  </modal>
</div>
</template>

<script>
import { ref } from '@vue/reactivity'
import BackgroundStackChooser from '../components/BackgroundStackChooser.vue'
import Section from '../components/Section.vue'
import { onMounted } from '@vue/runtime-core'
import Stack from '../models/stack'
import router from '../router/router'
import Modal from '../components/Modal.vue'
import Explorer from '../components/Explorer.vue'
import LeftLogo from '../components/LeftLogo.vue'
import System from '../models/system'
export default {
  name: 'StackChooser',
  components: {
    BackgroundStackChooser,
    SectionCmp: Section,
    Modal,
    Explorer,
    LeftLogo
  },
  setup() {
    const recents = ref([])
    onMounted(async () => {
      recents.value = await Stack.getAllConfsPath()
    })

    /** @type {import('vue').Ref<InstanceType<typeof Modal> | null>} */
    const modalRef = ref(null)
    return {
      modalRef,
      recents,
      System,
      /** @param {string} path */
      async deleteConf(path) {
        await Stack.deleteConf(path)
        recents.value = await Stack.getAllConfsPath()
      },
      openModal() {
        modalRef.value?.open().subscribe((res) => {
          if(!res) return 
        })
      },
      /** @param {string} recent */
      async openPath(recent) {
        await Stack.selectConf(recent)
        setTimeout(() => {
          router.push({name: 'stack-chooser'})
        }, 100);
      },
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.import-export-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  .import-export-container {
    display: flex;
    flex-direction: row;
    flex-grow: 2;
    flex-basis: 0;
    flex-shrink: 0;
    .section-recent {
      box-shadow: none;
      box-shadow: 0px 0px 12px 0px #000000;
      width: calc(100% - 50px);
      max-width: 600px;
      margin: auto;
      .recent {
        margin: 5px 0;
      }
      .recent:hover {
        transition: 300ms;
        background-color: rgba(0,0,0,0.05);
        cursor: pointer;

      }
    }
  }
}

  .version {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 40px;
    right: 40px;
  }
  .tools {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 40px;
    left: 40px;
  }
</style>

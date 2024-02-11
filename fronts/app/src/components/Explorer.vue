<template>
  <div class="explorer-root">
    <div class="explorer-content">
      <div class="header">
        <div class="current-directory">
          <i class="fas fa-folder-open" aria-hidden="true"></i>
          <div class="current-path">{{currentPath}}</div>
        </div>
      </div>
      <div class="explorer-view">
        <ul>
          <li v-for="dir of directories" :key="dir.name" @click="ls(dir.absolutePath)">
            <i class="fas fa-arrow-left" v-if="dir.name === '..'"  aria-hidden="true"></i>
            <i class="fas fa-folder" v-else-if="!dir.npmInfos"  aria-hidden="true"></i>
            <i class="fab fa-npm" v-else  aria-hidden="true"></i>
            {{dir.name}}
          </li>
        </ul>
        <ul>
          <li v-for="file of files" :key="file.name" class="success" @click="$emit('file', file.absolutePath)">
            <i class="fas fa-cog" aria-hidden="true"></i>
            {{file.name}}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import fs from '../models/fs'
export default {
  name: 'explorer',
  props: {
  },
  setup() {
    /** @type {import('vue').Ref<import('../../../../servers/server/routes/fs').Entry[]>} */
    const dir = ref([])
    const currentPath = ref('')
    /** @param {string} path */
    const ls = async path => {
      currentPath.value = path
      dir.value = await fs.ls(path)
    }
    onMounted(async() => {
      const homeDir = await fs.homeDir()
      await ls(homeDir)
    })
    return {
      dir,
      ls,
      currentPath,
      directories: computed(() => dir.value.filter(entry => entry.isDirectory)),
      files: computed(() => dir.value.filter(entry => !entry.isDirectory && entry.isStack))
    }
  }
}
</script>

<style scoped lang="scss">
.explorer-root {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 75px);
  overflow: auto;
  box-sizing: border-box;
  .explorer-content {
    height: calc(100vh - 300px);
    box-sizing: border-box;
    margin: 40px;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    .current-directory {
      display: flex;
      align-items: center;
      flex-grow: 1;
    }
  }
  .explorer-view {
    overflow: auto;
    padding: 10px;
    ul {
      margin: 0;
      list-style-type: none;
      li {
        display: flex;
        align-items: center;
        padding: 5px;
        &.success {
          color: green;
        }
        &:hover {
          background-color: rgba(0,0,0,0.1);
          cursor: pointer;
        }
      }
    }
  }
  i {
    font-size: 1.3em;
    margin-right: 10px;
    margin-left: 10px;
  }
  .current-path {
    background-color: rgba(255,255,255,0.1);
    padding: 5px;
    width: 100%;
    border-radius: 3px;
    font-size: 1.3em;
  }
}
</style>
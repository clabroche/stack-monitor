<template>
  <div class="explorer-root">
    <div class="explorer-content">
      <div class="header">
        <div class="current-directory">
          <i class="fas fa-folder-open" aria-hidden="true"></i>
          <div class="input">{{currentDir}}</div>
        </div>
        <div class="actions">
          <button class="action" @click="importDir" title="Import">
            <i class="fas fa-download" v-if="!importLoading"  aria-hidden="true"></i>
            <i class="fas fa-spinner" v-else  aria-hidden="true"></i>
          </button>
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
import fs from '../models/fs'
export default {
  name: 'explorer',
  props: {
  },
  computed: {
    directories() { return this.dir.filter(entry => entry.isDirectory)},
    files() { return this.dir.filter(entry => !entry.isDirectory && entry.isStack)}
  },
  data() {
    return {
      homeDir: '',
      currentDir: '',
      dir: [],
      importLoading: false
    }
  },
  async mounted() {
    this.homeDir = await fs.homeDir()
    await this.ls(this.homeDir)
  },
  methods: {
    async ls(path) {
      this.currentDir = path
      this.dir = await fs.ls(path)
    },
    async importDir() {
      this.importLoading = true
      this.projects = await fs.recursiveImport(this.currentDir)
      const local = localStorage.getItem('projectsPath')
      const existingPath = local ? JSON.parse(local) : []
      this.projects.forEach(project => {
        if(!existingPath.includes(project.path)) existingPath.push(project.path)
      })
      localStorage.setItem('projectsPath', JSON.stringify(existingPath))
      this.importLoading = false
      this.$router.push({name: 'home'})
    }
  }
}
</script>

<style scoped lang="scss">
.explorer-root {
  overflow: hidden;
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
  .input {
    background-color: rgba(255,255,255,0.1);
    padding: 5px;
    width: 100%;
    border-radius: 3px;
    font-size: 1.3em;
  }
  .actions {
    flex-grow: 0;
    flex-shrink: 0;
    .action {
      margin-left: 10px;
      margin-right: 10px;
      border-radius: 3px;
      background-color: #556666;
      color: white;
      border: none;
      padding: 5px;
      &:last-of-type {
        margin-right: 0;
      }
      i {
        margin: 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
  .fa-spinner {
    animation-name: spin;
    animation-duration: 500ms;
    animation-iteration-count: infinite;
    animation-fill-mode: forwards;
  }
}
@keyframes spin {
  0% {
    transform: rotateZ(0)
  }
  100% {
    transform: rotateZ(360deg)
  }
}
</style>
<template>
  <box
      :width="$root.getPosition(12)" :height="$root.getPosition(12)"
      :top="$root.getPosition(0)" :left="$root.getPosition(1)" v-if="project">
    <box
      border="line" :content='project.label' :scrollable="true" :mouse="true" :alwaysScroll="true" :scrollbar="{style: { bg: 'yellow' }}"
      :width="$root.getPosition(10)" :height="$root.getPosition(1)"
      :top="$root.getPosition(0)" :left="$root.getPosition(0)"/>
    <box
      border="line" content="Open VsCode" :mouse="true" @click="vscode" align='center' valign='middle'
      :width="$root.getPosition(1)" :height="$root.getPosition(1)"
      :top="$root.getPosition(0)" :left="$root.getPosition(10)"/>
    <box ref="stdout" label="Output"
      border="line" :content='project.store' :scrollable="true" :mouse="true" :alwaysScroll="true" :scrollbar="{style: { bg: 'yellow' }}"
      :width="$root.getPosition(8)" :height="$root.getPosition(9)"
      :top="$root.getPosition(1)" :left="$root.getPosition(0)"/>
    <box :width="$root.getPosition(3)" :height="$root.getPosition(4)" label="Git branches" v-if="project.git" :scrollable="true" :mouse="true" :alwaysScroll="true" :scrollbar="{style: { bg: 'yellow' }}"
      :top="$root.getPosition(1)" :left="$root.getPosition(8)" border="line">
      <box v-for="(branch, i) of project.git.branch" :key="branch" v-if="project.git.branch"
        :content="branch"
        :style="{ bg: branch.includes('*') ? 'white': null ,fg: branch.includes('*') ? 'black': null }"
        :width="$root.getPosition(11)" :height="1"
        :top="i" :left="0"/>
    </box>
    <box :width="$root.getPosition(3)" :height="$root.getPosition(5)" label="Git status" v-if="project.git" :scrollable="true" :mouse="true" :alwaysScroll="true" :scrollbar="{style: { bg: 'yellow' }}"
      :top="$root.getPosition(5)" :left="$root.getPosition(8)" border="line">
      <box v-for="(status, i) of project.git.status" :key="status" v-if="project.git.status"
        :content="status"
        :width="$root.getPosition(11)" :height="1"
        :top="i" :left="0"/>
    </box>
    <system :project="project"
      :width="$root.getPosition(11)" :height="$root.getPosition(2)" :left="$root.getPosition(0)" :top="$root.getPosition(10)"></system>
  </box>
</template>

<script>
import SystemVue from './System.vue';
import cp from 'child_process'
export default {
  name: 'project',
  props: {
    project: {default: _ => ({})},
  },
  components: {
    'system': SystemVue
  },
  watch: {
    'project.store'() {
      setTimeout(async () => {
      this.$refs.stdout.setScrollPerc(0)
      await this.$nextTick()
      this.$forceUpdate()
      this.$refs.stdout.setScrollPerc(100)
      }, 10);
    },
  },
  data: () => {
    return {
      systemData: []
    }
  },
  mounted() {
    this.updateGit()
    setTimeout(this.updateGit, 100)
    this.interval = setInterval(this.updateGit, 5000);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    async updateGit() {
      if(!this.project || !this.project.spawnOptions) return
      this.$set(this.project, 'git', {
        branch: await this.branches(),
        status: await this.status()
      })
    },
    branches() {
      return new Promise((resolve, reject) => {
        cp.exec('git branch', {
          cwd: this.project.spawnOptions.cwd
        }, (err, stdout, stderr) => {
          resolve(stdout.toString().split('\n'))
        })
      });
    },
    status() {
      return new Promise((resolve, reject) => {
        cp.exec('git status -s', {
          cwd: this.project.spawnOptions.cwd
        }, (err, stdout, stderr) => {
          resolve(stdout.toString().split('\n'))
        })
      });
    },
    vscode() {
      cp.exec('code .', {cwd: this.project.spawnOptions.cwd})
    }
  }
}
</script>

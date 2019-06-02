<template>
  <screen ref='screen' :smartCSR="true" :keys="true">
    <toggle-view @changeViewMode='changeMode'></toggle-view>
    <stack-chooser  v-if="!stack.length" @launch="launch"/>
    <component :is="activeMode" v-if="stack.length" :stack="stack"/>
    <!-- <box  v-else :width="$root.getPosition(12)" :height="$root.getPosition(12)" :top="$root.getPosition(0)" :left="$root.getPosition(0)"
      content="No stack found" align="center" valign="middle"/> -->
  </screen>
</template>

<script>
import ToggleViewsVue from './components/ToggleViews.vue';
import SingleViewVue from './views/SingleView.vue';
import MultipleViewVue from './views/MultipleView.vue';
import path from 'path'
import StackChooserVue from './views/StackChooser.vue';
import {spawn} from 'child_process'
import SpawnStore from './spawn.store'

export default {
  name: 'main',
  components: {
    'toggle-view': ToggleViewsVue,
    singleView: SingleViewVue,
    multipleView: MultipleViewVue,
    'stack-chooser': StackChooserVue,
  },
  data() {
    return {
      screen: null,
      stack: [],
      activeMode: 'singleView',
    }
  },
  created() {
    this.$root.getPosition = i => (i * 100 / 12) + '%'
    this.$root.getPositionNumber = i => (i * 100 / 12)
  },
  mounted() {
    this.$refs.screen.key(['C-c'], () => {
      this.$refs.screen.destroy()
      this.stack.map(microservice => {
        SpawnStore[microservice.label].kill('SIGINT')
      })
      setTimeout(() => {
        process.exit(0)
      }, 1000);
    })
  },
  methods: {
    launch(stack) {
      this.stack = stack
      this.stack.map((microservice, i) => {
        this.$set(microservice, 'store', '')
        SpawnStore[microservice.label] = spawn(microservice.spawnCmd, microservice.spawnArgs || [], microservice.spawnOptions)
        microservice.pid = SpawnStore[microservice.label].pid
        SpawnStore[microservice.label].stdout.on('data', data => {
          microservice.store += data.toString()
        })
        SpawnStore[microservice.label].stderr.on('data', data => {
          microservice.store += data.toString().red
        })
      })
    },
    changeMode(mode) {
      if(mode === 'multiple') this.activeMode = 'multipleView'
      if(mode === 'single') this.activeMode = 'singleView'
    }
  }
}
</script>

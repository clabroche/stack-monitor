<template>
  <box  :width="$root.getPosition(11)" :height="$root.getPosition(12)"
      :top="$root.getPosition(0)" :left="$root.getPosition(1)" >
    <sidebar :stack="stack"  v-model="currentProject"></sidebar>
    <project :project="currentProject"></project>
  </box>
</template>

<script>
import Sidebar from '../components/Sidebar.vue';
import ProjectVue from '../components/Project.vue';
export default {
  name: 'single-view',
  components: {
    'sidebar': Sidebar,
    'project': ProjectVue
  },
  data() {
    return {
      currentProject: null
    }
  },
  props: {
    stack: {default: _ => ([])}
  },
  mounted() {
    this.currentProject = this.stack[0]
  },
  methods: {
    launch(a) {
      console.log(a)
    }
  }
}
</script>

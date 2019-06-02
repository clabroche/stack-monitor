<template>
  <box :width="$root.getPosition(12)" :height="$root.getPosition(12)" :top="$root.getPosition(0)" :left="$root.getPosition(1)">
    <project-line :project="project" :offset="i"  v-for="(project,i) of stack" :key='project.label' :lineHeight="lineHeight"></project-line>
  </box>
</template>

<script>
import ProjectLineVue from '../components/ProjectLine.vue';
export default {
  name: 'multiple-view',
  components: {
    'project-line': ProjectLineVue
  },
  computed: {
    lineHeight() {
      return 100 / this.stack.length
    }
  },
  props: {
    stack: {default: _ => ([])}
  },
}
</script>

<template>
  <box 
        :width="$root.getPosition(12)" :height="lineHeight+'%'"
        :top="(offset * lineHeight) + '%'" :left="$root.getPosition(0)">
    <box ref='stdout' :label="project.label" border="line"  :content="project.store"  :scrollable="true" :mouse="true" :alwaysScroll="true" :scrollbar="{style: { bg: 'yellow' }}"
        :width="$root.getPosition(9)" :height="$root.getPosition(12)"
        :top="$root.getPosition(0)" :left="$root.getPosition(0)">
    </box>
    <system  :project="project"
      :width="$root.getPosition(2)" :height="$root.getPosition(12)"
      :left="$root.getPosition(9)" :top="$root.getPosition(0)"
    ></system>
  </box>
</template>

<script>
import SystemVue from './System.vue';
export default {
  name: 'project-line',
  components: {
    'system': SystemVue
  },
  props: {
    project: {default: _ => ({})},
    offset: {default: 0},
    lineHeight: {default: 0},
  },
  watch: {
    'project.store'() {
      this.$refs.stdout.setScrollPerc(100)
    }
  },
  mounted() {
    this.$refs.stdout.setScrollPerc(100)
  }
}
</script>

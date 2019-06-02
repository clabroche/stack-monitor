<template>
  <box>
    <box 
      :style='multipleSyle' border="line" content='Multiple'
      :width="$root.getPosition(1)" :height="$root.getPosition(1)"
      :top="0" :left="0" @click="setMultipleViewMode"/>
    <box 
      :style='singleSyle' border="line" content='Single'
      :width="$root.getPosition(1)" :height="$root.getPosition(1)"
      :top="$root.getPosition(1)" :left="0" @click="setSingleViewMode"/>
  </box>
</template>

<script>
export default {
  name: 'toggle-views',
  components: {
  },
  computed: {
    multipleSyle() {
      return {
        border: {
          fg: this.viewMode === 'multiple' ? 'red' : null,
        }
      }
    },
    singleSyle() {
      return {
        border: {
          fg: this.viewMode === 'single' ? 'red' : null,
        }
      }
    }
  },
  props: {
    screen: {default: null}
  },
  data: () => {
    return {
      viewMode: 'single'
    }
  },
  mounted () {
    this.$parent.$refs.screen.key(['f3'], this.setSingleViewMode)
    this.$parent.$refs.screen.key(['f4'], this.setMultipleViewMode)
  },
  methods: {
    setSingleViewMode() {
      this.viewMode = 'single'
      this.emit()
    },
    setMultipleViewMode() {
      this.viewMode = 'multiple'
      this.emit()
    },
    emit() {
      this.$emit('changeViewMode', this.viewMode)
    }
  }
}
</script>

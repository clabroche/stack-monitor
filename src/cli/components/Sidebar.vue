<template>
  <list :items="items" border="line" ref ='sidebar'
      :width="$root.getPosition(1)" :height="$root.getPosition(12)"
      :interactive="true"
      :clickable="true"
      :mouse="true"
      :style="{selected: {
          bg: 'white',
          fg: 'black'
        }}"
      :top="0" :left="$root.getPosition(0)" @click="viewMode = 'multiple'"
      @select="select($event.content)">
  </list>
</template>

<script>
export default {
  name: 'sideBar',
  data: () => {
    return {
      items: [],
      selected: null
    }
  },
  props: {
    stack: {default: _ => ([])}
  },
  mounted () {
    const stack = this.stack
    this.items = this.listAllMicroservices(stack)

    if(!stack.length) return
    this.selected = stack[0].label
    let selected
    this.interval = setInterval(() => {
      if(this.$refs.sidebar.selected !== selected) {
        selected = this.$refs.sidebar.selected
        this.select(stack[this.$refs.sidebar.selected].label)
      }
    }, 100);
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  props: {
    stack: {default: _ => ([])}
  },
  methods: {
    listAllMicroservices () {
      return this.stack.map(microservice =>  microservice.label)
    },
    select(label) {
      this.$emit('input', this.stack.filter(microservice => microservice.label === label).pop())
    },
  }
}
</script>

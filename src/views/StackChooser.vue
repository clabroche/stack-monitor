<template>
  <box  :width="$root.getPosition(12)" :height="$root.getPosition(12)"
      :top="$root.getPosition(0)" :left="$root.getPosition(0)" >
      <box  :width="$root.getPosition(4)" :height="$root.getPosition(1)" align="center" valign="middle"
        :top="$root.getPosition(2)" :left="$root.getPosition(4)" border="line" content="Choose microservices to launch:"/>
    <box  :width="$root.getPosition(4)" :height="$root.getPosition(4)"
        :top="$root.getPosition(3)" :left="$root.getPosition(4)" border="line">
      
      <box  :width="2" :height="1"
        :top="i"  :left="0"
        v-for="(microservice, i) of stack" :key="microservice.label + '-active'"
        :content="microservice.active ? 'x': ''" />
      <box  :width="$root.getPosition(11)" :height="1"
        :top="i"  :left='3' :clickable="true"
        v-for="(microservice, i) of stack" :key="microservice.label"
        @click="microservice.active = !microservice.active"
        :content="microservice.label" />
      <button  :width="$root.getPosition(3)" :height="$root.getPosition(2)"
        :top="$root.getPosition(10)" :left='$root.getPosition(1)' :clickable="true"
        @click="selectAll"
        border="line"
        content="Select all" />
      <button  :width="$root.getPosition(3)" :height="$root.getPosition(2)"
        :top="$root.getPosition(10)" :left='$root.getPosition(8)' :clickable="true"
        @click="launchMicroservices"
        border="line"
        content="Validate" />
    </box>
  </box>
</template>

<script>
export default {
  name: 'stack-chooser',
  components: {
  },
  data() {
    return {
      stack: ________________stack_____________________.map(m => {
        m.active = false
        return m
      })
    }
  },
  mounted() {
  },
  methods: {
    launchMicroservices() {
      this.$emit('launch', this.stack.filter(microservice => microservice.active))
    },
    selectAll() {
      this.stack.map(m => m.active = true)
    },
  }
}
</script>

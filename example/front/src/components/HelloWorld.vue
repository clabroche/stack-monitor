<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    The server replied: {{serverMsg}}
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      serverMsg: ''
    }
  },
  async mounted() {
    const response = await fetch(process.env.VUE_APP_API_URL)
    this.serverMsg = await response.text()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

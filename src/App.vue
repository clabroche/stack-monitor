<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import Stack from './models/stack'
export default {
  async mounted() {
    const stack = await Stack.getCurrentStack()
    if(!stack.length && this.$route.name !== 'stack-chooser') this.$router.push({name:'stack-chooser'})
    if(stack.length && this.$route.name !== 'stack-single') this.$router.push({name:'stack-single'})
  }
}
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/all.min.css';
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background: url(assets/background1.jpg) no-repeat center fixed;
  
  #app {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
button {
  padding: 10px;
  margin: 3px;
  background-color: #d1aa41;
  color: white;
  font-weight: bold;
  border:none;
}
button.success {
  background-color: #41d143;
}
</style>

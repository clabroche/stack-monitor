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
@import './assets/fonts/Jost/Jost.css';
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f4f4f4;
  color: #4c4c4c;
  font-size: 0.9em;
  font-family: JOST;
  
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
  border-radius: 4px;
  background-color: #0054bc;
  color: white;
  font-weight: bold;
  border:none;
  transition: 300ms;
  cursor: pointer;
  box-sizing: border-box;
  &:hover {
    background-color: #194f91;
    transform: scale(1.01);
    box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
  }
  &.small {
    padding: 5px;
    font-size: 0.7em;
  }
}

button.success {
  background-color: #41d143;
  &:hover {
    background-color: #258d27;
  }
}

</style>

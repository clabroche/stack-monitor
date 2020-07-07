<template>
  <div id="app">
    <sidebar v-if="$route.name !== 'stack-chooser'"/>
    <router-view/>
  </div>
</template>

<script>
import Stack from './models/stack'
import sidebarVue from './components/sidebar.vue'
export default {
  components: {
    sidebar: sidebarVue
  },
  async mounted() {
    const stack = await Stack.getCurrentStack()
    if(!stack.length && this.$route.name !== 'stack-chooser') this.$router.push({name:'stack-chooser'})
    if(stack.length && this.$route.name !== 'stack-single') this.$router.push({name:'stack-single', params: {label: stack[0].label}})
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
    overflow: hidden;
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
    width: 70px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    i {
      margin-right: 5px;
    }
    .text {
      flex-grow: 1;
      text-align: center;
    }
  }
}

button.success {
  background-color: #41d143;
  &:hover {
    background-color: #258d27;
  }
}

</style>

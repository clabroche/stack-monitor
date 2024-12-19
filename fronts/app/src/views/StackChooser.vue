<template>
<div class="stack-chooser-root" >
  <background-stack-chooser :lowResources="true"></background-stack-chooser>
  <left-logo/>
  <div class="right">
    <StackChooserCmp class="stack-chooser"></StackChooserCmp>
  </div>
  <div class="version">
    {{System.version.value}}
  </div>

  <div class="tools" @click="router.push({name: 'Toolbox'})">
    <i class="fas fa-toolbox"></i>
  </div>
</div>
</template>

<script setup>
import System from '../models/system'
import BackgroundStackChooser from '../components/BackgroundStackChooser.vue'
import StackChooserCmp from '../components/StackChooser.vue'
import LeftLogo from '../components/LeftLogo.vue'
import {useRouter} from 'vue-router'
const router = useRouter();

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.stack-chooser-root {
  width: 100vw;
  height: 100vh;
  display: flex; 
  justify-content: space-between;
  align-items: center;
  position: relative;
  .right {
    flex-grow: 2;
    flex-basis: 0;
    flex-shrink: 0;
  }
  .version {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 40px;
    right: 40px;
  }
  .tools {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 40px;
    left: 40px;
  }
  .stack-chooser {
    max-width: 400px;
    max-height: calc(100vh - 50px);
  }
}
</style>

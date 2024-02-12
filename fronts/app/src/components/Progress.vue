<template>
  <span class="container">    
    <div class="progress progress-moved">
      <div class="progress-bar" :style="{transform: 'scaleX(' + ((percent > 100 ? 100 : percent)/ 100) + ')'}">
      </div>                       
    </div> 
  </span>
</template>

<script>
export default {
  props: {
    percent: {default: 0}
  }
}
</script>

<style lang="scss" scoped>

.container {
  width: 100%;
  text-align: center;
}

.progress {
  padding: 3px;
  box-sizing: border-box;
  border-radius: 100px;
  background: #dfdfdf;  
  box-shadow: inset 0 1px 2px 2px #ccc;
}

.progress-bar {
  height: 10px;
  width: 100%;
  border-radius: 4px;
  background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
  transform: translateZ(0);
  transform-origin: left;
  transition: 0.4s linear;  
  transition-property: transform;    
  background-color: #0054bc;
}


</style>
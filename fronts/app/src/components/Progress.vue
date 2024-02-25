<template>
  <span class="container">    
    <div class="progress progress-moved">
      <div class="progress-bar" :style="{width: `${(percent > 100 ? 100 : percent)}%`}">
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
  background-image: linear-gradient(to bottom, var(--system-accent-backgroundColor1), var(--system-accent-backgroundColor1-darkest));
  border-radius: 100px;
  overflow: hidden;
  transform: translateZ(0);
  transform-origin: left;
  transition: 0.4s linear;  
  transition-property: width;    
  background-color: #0054bc;
}


</style>
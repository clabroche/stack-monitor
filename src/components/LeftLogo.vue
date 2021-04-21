<template>
<div class="left">
  <div class="logo">
    Stack Monitor
    <img src="@/assets/rocket.png" alt="">
  </div>
</div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.left {
  background-color: rgba(0,0,0,0.1);
  height: 100%;
  flex-grow: 1;
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  color: white;
  flex-basis: 0;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.5);
  .logo {
    font-size: 4em;
    display: flex;
    flex-direction: column;
    text-align: center;
    text-shadow:  0 10px 5px rgba(0,0,0,0.5);
    img {
      width: 200px;
      margin: auto;
    }
  }
}

</style>
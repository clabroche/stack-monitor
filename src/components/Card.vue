<template>
  <div class="card-root" :class="color">
    <div class="card-container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    color: {default: 'blue'}
  }
}
</script>

<style lang="scss" scoped>

@mixin card($mainColor, $secondaryColor, $shadow) {
  background: $mainColor;
  background: linear-gradient(93deg, $mainColor 0%, $secondaryColor 100%);
  color: white;
  box-shadow:
    0 0 5px 0 $shadow;
  &::before, &::after {
    box-shadow:
      inset 0 0 50px $mainColor,
      inset -20px 0 300px $mainColor,
      0 0 50px #fff,
      -10px 0 80px $mainColor,
      10px 0 80px $mainColor;
  }
}
.card-root {
  width: 300px;
  height: 100px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  &::before, &::after {
    content: "";
    width: 150%;
    height: 75%;
    border-radius: 100%;
    position: absolute;
    top: 0;
    right: -100%;
    transform: rotate(20deg);
    transform-origin: top;

  }
  &::after {
    height: 45%;
  }
  .card-container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
  }

  &.blue {
    @include card(rgb(45,183,208), rgb(0,247,255), rgb(45,183,208))
  }
  &.purple {
    @include card(rgb(168, 38, 180), rgb(157, 27, 209), rgb(211, 22, 229))
  }

  &.orange {
    @include card(rgb(255, 123, 0), rgb(170, 115, 32), rgb(229, 139, 22));
  }
}

</style>
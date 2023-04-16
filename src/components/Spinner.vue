<template>
  <div
    class="spinner"
    v-if="display"
    :style="{
      width: size + 'px',
      height: size + 'px',
    }"
  ></div>
</template>

<script setup>
defineProps({
  display: {
    type: Boolean,
    default: true,
  },
  size: {
    default: "70",
  },
})
</script>
<style lang="scss">
.spinner {
  animation-name: spin !important;
  animation-duration: 0.8s !important;
  animation-fill-mode: forwards !important;
  animation-iteration-count: infinite !important;
  &::before {
    animation-name: pulse !important;
    animation-duration: 0.8s !important;
    animation-fill-mode: forwards !important;
    animation-iteration-count: infinite !important;
  }
}

@keyframes spin {
  0% {
    transform: rotateZ(360deg);
  }

  100% {
    transform: rotateZ(0deg);
  }
}

@keyframes pulse {
  0% {
    width: 0%;
    height: 0%;
    opacity: 1;
  }

  100% {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}
</style>
<style scoped lang="scss">
.spinner {
  border: 3px solid #0076bc;
  width: 70px;
  height: 70px;
  box-sizing: border-box;
  border-radius: 100%;
  border-bottom-color: transparent;
  animation-name: spin;
  animation-duration: 0.8s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateZ(0);
  flex-shrink: 0;

  &::before {
    content: " ";
    animation-name: pulse;
    animation-duration: 0.8s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    background-color: #0076bc;
    position: absolute;
    border-radius: 100%;
  }

  &::after {
    content: " ";
    width: 30%;
    height: 30%;
    background-color: #0076bc;
    position: absolute;
    border-radius: 100%;
  }
}

@keyframes spin {
  0% {
    transform: rotateZ(360deg);
  }

  100% {
    transform: rotateZ(0deg);
  }
}

@keyframes pulse {
  0% {
    width: 0%;
    height: 0%;
    opacity: 1;
  }

  100% {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}
</style>
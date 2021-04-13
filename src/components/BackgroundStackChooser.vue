<template>
  <div class="background-root">
    <div class="stars">
      <div class="star" v-for="(star, i) in stars" :key="'star-'+i" :style="{...star}"></div>
    </div>
    <div class="bars left">
      <div class="bar" v-for="(bar, i) in barsLeft" :key="'bar-left'+i" :style="{...bar}"></div>
    </div>
    <div class="bars right">
      <div class="bar" v-for="(bar, i) in barsRight" :key="'bar-right'+i" :style="{...bar}"></div>
    </div>
  </div>
</template>

<script>
import { ref } from '@vue/reactivity'
import { onBeforeUnmount, onMounted } from '@vue/runtime-core'
export default {
  setup() {
    const stars = ref([])
    const getStarPosition = (i) => {
      const line = Math.floor((i * 100 / 5) / 100)
      const maxLine = Math.floor((100 * 100 / 5) / 100)
      const left = (i * 100 / 5) % 100
      const top =  line*100/maxLine
      const random = Math.floor(Math.random() * 40)
      const randomizedLeft = Math.random() > 0.5 ? left + random : left - random
      const randomizedTop = Math.random() > 0.5 ? top + random : top - random
      return {
        top: randomizedTop+'%',
        left: randomizedLeft + '%',
        backgroundColor: `rgba(255, 255, 255, 0.6)`,
        boxShadow: '0 0 10px 1px white',
      }
    }
    onMounted(()=> stars.value = Array(100).fill().map((_, i) => getStarPosition(i)))

    // Bars
    const nbBars = 10
    const getBarLeftPosition = (i) => {
      const top =  i*100/nbBars
      const randomizedLeft = top
      return {bottom: 0, top: randomizedLeft + '%', width: (Math.random() * 50) + '%' }
    }
    const getBarRightPosition = (i) => {
      const top =  i*100/nbBars
      const randomizedLeft = top
      return {right: 0, top: randomizedLeft + '%', width: (Math.random() * 50) + '%' }
    }
    const barsLeft = ref([])
    const barsRight = ref([])
    onMounted(() => barsLeft.value = Array(10).fill().map((_, i) => getBarLeftPosition(i)))
    onMounted(() => barsRight.value = Array(10).fill().map((_, i) => getBarRightPosition(i)))

    const interval = setInterval(() => {
      stars.value.map(star => {
        const opacity = (Math.random() / 3) + 1/3
        star.backgroundColor = `rgba(255, 255, 255, ${opacity})`
      })
    }, 300);
    onBeforeUnmount(()=> clearInterval(interval))
    return {
      barsLeft,
      barsRight,
      stars,
    }
  }
}
</script>

<style lang="scss" scoped>
.background-root {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: 
    radial-gradient(circle at 74.02% 88.01%, #382d92, transparent 41%),
    radial-gradient(circle at 68.03% 89.02%, #382d92, transparent 9%),
    radial-gradient(circle at 0% 50%, #252388, transparent 50%),
    radial-gradient(circle at 0 63.01%, #312b5c, transparent 40%),
    radial-gradient(circle at 50% 100%, rgb(24, 19, 92), transparent 40%),
    radial-gradient(circle at 50% 50%, #382d92, #060130 100%);
  .stars {
    .star {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      position: absolute;
      transition: 300ms;
    }
  }
  .bars {
    .bar {
      height: 30px;
      border-radius: 20px;
      background-color: #ffffff1a;
      filter: blur(10);
      position: absolute;
    }
  }
  .bars.left {
    .bar {
      left: 0;
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
    }
  }
  .bars.right {
    .bar {
      right: 0;
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
    }
  }
}
</style>
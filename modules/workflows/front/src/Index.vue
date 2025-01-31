<template>
  <iframe ref="iframe" src="/red" width="100%" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Socket from '../../../../fronts/app/src/helpers/Socket';

const iframe = ref()
const onStart = () => {
  iframe.value.contentWindow.location.reload();
}

Socket.on('scenarios:start', onStart)
onUnmounted(() => {
  Socket.off('scenarios:start', onStart)
})
</script>
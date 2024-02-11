<template>
    <component :is="component"></component>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const component = ref();
watchEffect(() => {
  component.value = router.currentRoute.value.params.plugin;
});
</script>

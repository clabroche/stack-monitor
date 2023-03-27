<template>
    <component :is="component"></component>
</template>

<script setup>
import router from '@/router/router'
import {ref, watchEffect} from 'vue'

const component = ref()
watchEffect(() => {
    component.value = router.currentRoute.value.params.plugin
})
</script>
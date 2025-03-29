<template>
  <Button 
    severity="primary"
    outlined 
    @click="handleCopy"
  >
    <template v-if="copied">
      <i class="fas fa-check mr-2"></i>
      Copied!
    </template>
    <template v-else>
      <slot></slot>
    </template>
  </Button>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  text: {
    type: String,
    required: true
  }
});

const copied = ref(false);

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}
</script>

<style scoped>
:deep(.p-button) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style> 
<template>
  <Inplace>
    <template #display>
      <div class="inplace-display-content">
        <span v-if="modelValue" class="inplace-display-text flex-1">{{ modelValue }}</span>
        <span v-else class="placeholder-text flex-1" >{{ placeholder }}</span>
        <i class="fas fa-pencil-alt edit-icon"></i>
      </div>
    </template>
    <template #content="{ closeCallback }">
      <span class="inline-flex items-center gap-2 w-full" >
        <InputText 
          class="input-text"
          ref="inputRef"
          :value="modelValue"
          @input="handleInput"
          autofocus
          @blur="handleBlur(closeCallback)"
        />
      </span>
    </template>
  </Inplace>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import Inplace from 'primevue/inplace';
import InputText from 'primevue/inputtext';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'save']);
const inputRef = ref(null);
watch(() => inputRef.value, (newVal) => {
  if(newVal?.$el?.focus) {
    newVal.$el.focus(); 
  }
});
function handleInput(event) {
  if (event && event.target instanceof HTMLInputElement) {
    emit('update:modelValue', event.target.value);
  }
}
function handleBlur(closeCallback) {
  emit('save', inputRef.value);
  closeCallback();
}
</script>

<style lang="scss" scoped>
.inplace-display-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .edit-icon {
    font-size: 0.8rem;
    color: var(--system-text-tertiaryLabel);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

.placeholder-text {
  color: var(--system-text-tertiaryLabel);
  font-style: italic;
}

.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.w-full {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

:deep(.p-inplace) {
  width: 100%;
  
  .p-inplace-display {
    width: 100%;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--system-neutral-03);
      cursor: pointer;

      .edit-icon {
        opacity: 1;
      }
    }
  }
  
  .p-inplace-content {
    width: 100%;
  }
}
.input-text {
  width: 100%;
}
</style> 
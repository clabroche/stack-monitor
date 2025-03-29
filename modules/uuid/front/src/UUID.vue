<template>
  <div class="uuid-root">
    <h1>Generate UUID</h1>
    <SectionCmp>
      <div class="section-content">
        <div class="options">
          <div class="option">
            <div class="number-input">
              <Button icon="fas fa-minus" severity="secondary" @click="decrementCount" />
              <InputNumber v-model="count" :min="1" :max="100" @change="generate" />
              <Button icon="fas fa-plus" severity="secondary" @click="incrementCount" />
            </div>
          </div>
          <div class="option">
            <Checkbox 
              v-model="noDash" 
              inputId="noDash" 
              name="noDash" 
              :value="true" 
              :binary="true"
              @change="formatUuids" 
            />
            <label for="noDash" class="ml-2">No dashes</label>
          </div>
          <div class="option">
            <Checkbox 
              v-model="uppercase" 
              inputId="uppercase" 
              name="uppercase" 
              :value="true" 
              :binary="true"
              @change="formatUuids" 
            />
            <label for="uppercase" class="ml-2">Uppercase</label>
          </div>
        </div>
        <div class="uuids">
          <div v-for="(uuid, index) in uuids" :key="index" class="uuid-item">
            <div class="uuid-content">
              <h2>{{ uuid }}</h2>
              <div class="copy-buttons">
                <CopyButton :text="uuid">
                  <i class="fas fa-copy"></i>
                </CopyButton>
                <CopyButton :text="`&quot;${uuid}&quot;`">
                  "..."
                </CopyButton>
                <CopyButton :text="`&apos;${uuid}&apos;`">
                  '...'
                </CopyButton>
              </div>
            </div>
          </div>
        </div>
        <div class="actions">
          <Button icon="fas fa-random" severity="primary" @click="() => generate(true)" class="generate-button">
            Regenerate
          </Button>
          <CopyButton :text="uuids.join('\n')" class="copy-all" outlined>
            <i class="fas fa-copy"></i> Copy All UUIDs
          </CopyButton>
        </div>
      </div>
    </SectionCmp>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import CopyButton from './CopyButton.vue';
import axios from '../../../../fronts/app/src/helpers/axios';

/** @type {import('vue').Ref<number>} */
const count = ref(1);
/** @type {import('vue').Ref<boolean>} */
const noDash = ref(false);
/** @type {import('vue').Ref<boolean>} */
const uppercase = ref(false);
/** @type {import('vue').Ref<string[]>} */
const uuids = ref([]);
/** @type {import('vue').Ref<string[]>} */
const originalUuids = ref([]);

onMounted(generate);

/**
 * Increment UUID count and regenerate
 * Maximum value is 100
 */
function incrementCount() {
  if (count.value < 100) {
    count.value++;
    generate();
  }
}

/**
 * Decrement UUID count and regenerate
 * Minimum value is 1
 */
function decrementCount() {
  if (count.value > 1) {
    count.value--;
    generate();
  }
}

/**
 * Generate new UUIDs or regenerate existing ones
 * @param {boolean} [isRegenerate=false] - If true, regenerate all UUIDs
 */
async function generate(isRegenerate = false) {
  const { data } = await axios.get('/uuid', {
    params: {
      count: count.value,
      noDash: noDash.value,
      uppercase: uppercase.value
    }
  });
  const newUuids = Array.isArray(data) ? data : [data];
  
  if (isRegenerate) {
    originalUuids.value = [...newUuids];
  } else {
    if (count.value > originalUuids.value.length) {
      const additionalUuids = newUuids.slice(originalUuids.value.length);
      originalUuids.value = [...originalUuids.value, ...additionalUuids];
    } else if (count.value < originalUuids.value.length) {
      originalUuids.value = originalUuids.value.slice(0, count.value);
    }
  }
  
  formatUuids();
}

/**
 * Format UUIDs based on current options (noDash and uppercase)
 */
function formatUuids() {
  uuids.value = originalUuids.value.map(uuid => {
    let formatted = uuid;
    if (noDash.value) {
      formatted = formatted.replace(/-/g, '');
    }
    if (uppercase.value) {
      formatted = formatted.toUpperCase();
    }
    return formatted;
  });
}

// Watch only count changes
watch(count, () => {
  generate();
});
</script>

<style scoped lang="scss">
.uuid-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.section-content {
  align-items: center;
  gap: 1rem;
}

.options {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  :deep(.p-checkbox) {
    width: 20px;
    height: 20px;
  }

  label {
    cursor: pointer;
    user-select: none;
  }
}

.uuids {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
}

.uuid-item {
  padding: 0.5rem;
  background: var(--system-secondary-backgroundColor);
  border-radius: 4px;
}

.uuid-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.uuid-content h2 {
  font-size: 0.9rem;
  margin: 0;
  color: var(--system-color);
}

.copy-buttons {
  display: flex;
  gap: 0.25rem;
}

.copy-buttons :deep(.p-button) {
  padding: 0.25rem 0.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  position: relative;
}

.copy-buttons :deep(.p-button[data-tooltip])::after {
  content: attr(data-tooltip);
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--system-secondary-backgroundColor);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--system-color);
  white-space: nowrap;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s;
}

.copy-buttons :deep(.p-button:not([data-tooltip]))::after {
  opacity: 0;
}

.generate-button {
  padding: 0.5rem 1rem;
  width: max-content;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  :deep(.p-inputnumber-input) {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid var(--system-border);
    border-radius: 4px;
    background: var(--system-backgroundColor);
    color: var(--system-color);
  }
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.copy-all {
  width: auto !important;
}
</style>

<template>
  <div class="configuration-container">
    <!-- Environment Variables section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <i class="fas fa-cog mr-2"></i>
          <span>Environment Variables</span>
          <i v-tooltip="'Active environment variables for your service'" class="fas fa-question-circle ml-2 hint-icon"></i>
        </div>
        <div class="section-actions">
          <Button 
            label="Download .env" 
            icon="fas fa-download" 
            @click="exportEnv" 
            size="small"
          />
          <Button 
            label="Environment variables editor" 
            icon="fas fa-edit" 
            @click="openEditModal" 
            size="small"
          />
        </div>
      </div>

      <div class="section-content">
        <!-- Search input -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <input v-model="searchQuery" class="search-input" placeholder="Search variables..." />
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>

        <!-- Variables count -->
        <div class="variables-stats">
          <span class="variables-count">{{ filteredVariables.length }} variables</span>
          <span v-if="filteredVariables.length !== Object.keys(environmentVariables).length" class="variables-filtered">
            (filtered from {{ Object.keys(environmentVariables).length }} total)
          </span>
        </div>

        <!-- Variables list -->
        <div v-if="filteredVariables.length > 0" class="env-list">
          <TransitionGroup name="env-list">
            <div v-for="key in filteredVariables" :key="key" class="env-item">
              <div class="env-item-content">
                <div class="env-item-header">
                  <span class="env-key" :title="key">{{ key }}</span>
                  <div class="env-item-actions">
                    <Button 
                      icon="fas fa-copy" 
                      text 
                      @click="copyValue(environmentVariables[key])"
                      v-tooltip="'Copy value'"
                      class="action-btn"
                    />
                  </div>
                </div>
                <div class="env-value-container">
                  <span class="env-value" :title="environmentVariables[key]">
                    {{ formatValue(environmentVariables[key]) }}
                  </span>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
        
        <!-- Empty state -->
        <div v-else class="empty-state">
          <i class="fas fa-search fa-2x empty-icon"></i>
          <p class="empty-text">No variables match your search criteria</p>
        </div>
      </div>
    </div>

    <!-- Modal for editing environment variables -->
    <ModalEditEnvs ref="modalEditEnvsRef" :service="props.service" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, onBeforeUnmount } from 'vue';
import Button from 'primevue/button';
import axios from '../../../../fronts/app/src/helpers/axios';
import ModalEditEnvs from './ModalEditEnvs.vue';
import stack from '../../../../fronts/app/src/models/stack';
import Socket from '../../../../fronts/app/src/helpers/Socket';

const props = defineProps({
  service: {
    type: Object,
    required: true
  }
});

const environmentVariables = ref({});
const modalEditEnvsRef = ref();
const searchQuery = ref('');

const currentEnvironment = ref({ label: '', envs: {}, overrideEnvs: {} });

// Function to load environment variables
async function loadEnvVars() {
  try {
    currentEnvironment.value = await stack.getEnvironment();
    const { data } = await axios.get('/stack/export-env', {
      params: {
        environment: currentEnvironment.value.label,
        service: props.service.label
      }
    });
    environmentVariables.value = data;
  } catch (error) {
    console.error('Failed to load environment variables:', error);
  }
}

onMounted(async () => {
  await loadEnvVars();
  Socket.on('conf:update', loadEnvVars);
  Socket.on('reloadEnvironments', loadEnvVars);
});

// Clean up socket listener on component unmount
onBeforeUnmount(() => {
  Socket.off('conf:update');
  Socket.off('reloadEnvironments');
});

const filteredVariables = computed(() => {
  const allKeys = Object.keys(environmentVariables.value);
  
  // Apply search filter
  let filtered = allKeys.filter(key => 
    key.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    String(environmentVariables.value[key]).toLowerCase().includes(searchQuery.value.toLowerCase())
  );
  
  // Sort alphabetically
  return filtered.sort((a, b) => a.localeCompare(b));
});

function formatValue(value) {
  if (value === undefined || value === null) return '';
  
  const strValue = String(value);
  
  // For very long values, truncate
  if (strValue.length > 100) {
    return strValue.substring(0, 100) + '...';
  }
  
  return strValue;
}

async function exportEnv() {
  try {
    const { data: exportedEnv } = await axios.get('/stack/export-env', { 
      params: { 
        environment: currentEnvironment.value.label, 
        service: props.service.label 
      } 
    });
    
    const envString = Object.keys(exportedEnv)
      .map((key) => `${key}=${exportedEnv[key]}`)
      .join('\n');
      
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(envString)}`);
    element.setAttribute('download', '.env');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.error('Failed to export environment variables:', error);
  }
}

function copyValue(value) {
  navigator.clipboard.writeText(value)
    .then(() => {
      // Future enhancement: Show toast
      console.log('Copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
}

function openEditModal() {
  modalEditEnvsRef.value.open();
}
</script>

<style lang="scss" scoped>
.configuration-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.75rem;
}

.section {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--system-sections-backgroundColor);
  border-radius: 6px;
  border: 1px solid var(--system-border-borderColor);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--system-border-borderColor);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 500;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.edit-btn {
  font-size: 0.85rem;
}

.hint-icon {
  font-size: 11px;
  margin-left: 5px;
  color: var(--system-text-tertiaryLabel);
  cursor: help;
  
  &:hover {
    color: var(--system-text-secondaryLabel);
  }
}

.section-content {
  margin-top: 0.5rem;
}

.search-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border-radius: 4px;
  border: 1px solid var(--system-border-borderColor);
  background-color: var(--system-tertiary-backgroundColor);
  color: var(--system-text-primaryLabel);
  
  &:focus {
    outline: none;
    border-color: var(--system-blue-color);
    box-shadow: 0 0 0 1px var(--system-blue-color);
  }
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--system-text-tertiaryLabel);
  pointer-events: none;
}

.variables-stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.variables-count {
  font-weight: 500;
  color: var(--system-text-primaryLabel);
}

.variables-filtered {
  color: var(--system-text-tertiaryLabel);
}

.env-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.env-item {
  background-color: var(--system-tertiary-backgroundColor);
  border-radius: 4px;
  padding: 0.75rem;
  border: 1px solid var(--system-border-borderColor);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--system-blue-color);
    box-shadow: 0 0 0 1px var(--system-blue-color, rgba(0, 120, 212, 0.2));
  }
}

.env-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.env-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.env-key {
  font-weight: 600;
  color: var(--system-text-primaryLabel);
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.env-value-container {
  background-color: var(--system-secondary-backgroundColor);
  border-radius: 3px;
  padding: 0.5rem;
  overflow-x: auto;
}

.env-value {
  color: var(--system-text-secondaryLabel);
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.env-item-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  
  &:hover {
    background-color: var(--system-quaternary-backgroundColor);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--system-text-tertiaryLabel);
}

.empty-icon {
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 0.95rem;
  text-align: center;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

// Transition animations
.env-list-enter-active,
.env-list-leave-active {
  transition: all 0.3s ease;
}

.env-list-enter-from,
.env-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.env-list-move {
  transition: transform 0.3s ease;
}
</style> 
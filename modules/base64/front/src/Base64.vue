<template>
  <div class="base64-tool">
    <h1>Base64 Encoder/Decoder</h1>
    <SectionCmp>
      <div class="base64-container">
        
        <!-- Converter Panel -->
        <div class="converter-panel">
          <div class="mode-selector">
            <div class="mode-radio-group">
              <RadioButton v-model="mode" value="encode" inputId="mode-encode" />
              <label for="mode-encode" class="mode-label">Encode</label>
            </div>
            <div class="mode-radio-group">
              <RadioButton v-model="mode" value="decode" inputId="mode-decode" />
              <label for="mode-decode" class="mode-label">Decode</label>
            </div>
          </div>
          
          <div class="input-output-container">
            <div class="input-container">
              <h3>Input</h3>
              <div class="textarea-wrapper">
                <Textarea 
                  v-model="inputValue" 
                  rows="10" 
                  class="text-area" 
                  :placeholder="inputPlaceholder"
                  @input="processInput" 
                />
                <Button 
                  icon="fas fa-copy" 
                  class="p-button-rounded p-button-secondary copy-button" 
                  @click="copyToClipboard(inputValue)" 
                  :disabled="!inputValue"
                  title="Copy to clipboard" 
                />
              </div>
            </div>
            
            <div class="swap-button-container">
              <Button 
                icon="fas fa-exchange-alt" 
                class="p-button-rounded p-button-secondary" 
                @click="swapInputOutput" 
                :disabled="!inputValue || !outputValue"
                title="Swap input and output" 
              />
            </div>
            
            <div class="output-container">
              <h3>Output</h3>
              <div class="textarea-wrapper">
                <Textarea 
                  v-model="outputValue" 
                  rows="10" 
                  class="text-area" 
                  readonly 
                  :placeholder="outputPlaceholder"
                />
                <Button 
                  icon="fas fa-copy" 
                  class="p-button-rounded p-button-secondary copy-button" 
                  @click="copyToClipboard(outputValue)" 
                  :disabled="!outputValue"
                  title="Copy to clipboard" 
                />
              </div>
            </div>
          </div>
          
          <div class="controls">
            <Button 
              :label="mode === 'encode' ? 'Encode' : 'Decode'" 
              :icon="mode === 'encode' ? 'fas fa-lock' : 'fas fa-unlock'" 
              class="p-button-primary" 
              @click="processInput" 
              :disabled="!inputValue"
            />
            <Button 
              label="Clear" 
              icon="fas fa-trash" 
              class="p-button-secondary" 
              @click="clearInputOutput" 
            />
            <Button 
              v-if="inputValue && outputValue" 
              label="Save to History" 
              icon="fas fa-save" 
              class="p-button-info" 
              @click="saveToHistory" 
            />
          </div>
        </div>
        
        <!-- History Panel -->
        <div class="history-panel">
          <div class="history-header">
            <h3>History</h3>
            <Button 
              label="Clear History" 
              icon="fas fa-trash" 
              class="p-button-danger p-button-sm" 
              @click="confirmClearHistory" 
              :disabled="!historyItems.length" 
            />
          </div>
          
          <div v-if="!historyItems.length" class="no-history">
            <div class="empty-state">
              <i class="fas fa-history empty-icon"></i>
              <p>No items in history</p>
            </div>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="(item, index) in historyItems" 
              :key="index" 
              class="history-item" 
              @click="loadFromHistory(item)"
            >
              <div class="history-item-header">
                <div class="history-mode" :class="item.mode">
                  {{ item.mode === 'encode' ? 'Encode' : 'Decode' }}
                </div>
                <div class="history-content">{{ trimText(item.input, 30) }}</div>
              </div>
              <div class="history-item-footer">
                <div class="history-timestamp">{{ formatTimestamp(item.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCmp>
    
    <!-- Confirmation Dialog -->
    <Dialog v-model:visible="clearHistoryDialog" header="Clear History" :modal="true" :closable="false" :style="{ width: '400px' }" :closeOnEscape="false">
      <p>Are you sure you want to clear all history? This action cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" icon="fas fa-times" class="p-button-secondary" @click="clearHistoryDialog = false" />
        <Button label="Clear" icon="fas fa-trash" class="p-button-danger" @click="clearHistory" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import RadioButton from 'primevue/radiobutton';
import Dialog from 'primevue/dialog';

// Type definitions pour résoudre les erreurs de linter
/**
 * @typedef {Object} HistoryItem
 * @property {string} mode - 'encode' ou 'decode'
 * @property {string} input - La valeur d'entrée
 * @property {string} output - La valeur de sortie
 * @property {string} timestamp - La date de création de l'élément d'historique
 */

// Constants
const HISTORY_STORAGE_KEY = 'base64-tool-history';
const MAX_HISTORY_ITEMS = 20;

// State
const mode = ref('encode');
const inputValue = ref('');
const outputValue = ref('');
/** @type {import('vue').Ref<HistoryItem[]>} */
const historyItems = ref([]);
const clearHistoryDialog = ref(false);
const processing = ref(false);

// Computed properties
const inputPlaceholder = computed(() => {
  return mode.value === 'encode' 
    ? 'Enter text to encode to Base64' 
    : 'Enter Base64 to decode';
});

const outputPlaceholder = computed(() => {
  return mode.value === 'encode' 
    ? 'Base64 encoded result will appear here' 
    : 'Decoded text will appear here';
});

// Load history from localStorage on component mount
onMounted(() => {
  loadHistoryFromStorage();
});

/**
 * Process input text based on current mode
 */
async function processInput() {
  if (!inputValue.value || processing.value) return;
  
  processing.value = true;
  try {
    const endpoint = mode.value === 'encode' ? '/base64/encode' : '/base64/decode';
    const { data } = await axios.post(endpoint, { value: inputValue.value });
    
    if (data.result !== undefined) {
      outputValue.value = data.result;
    }
  } catch (error) {
    console.error(`Error ${mode.value}ing:`, error);
  } finally {
    processing.value = false;
  }
}

/**
 * Swap input and output values and toggle the mode
 */
function swapInputOutput() {
  if (!inputValue.value || !outputValue.value) return;
  
  const temp = inputValue.value;
  inputValue.value = outputValue.value;
  outputValue.value = temp;
  
  // Toggle mode
  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
}

/**
 * Copy text to clipboard
 * @param {string} text - The text to copy
 */
function copyToClipboard(text) {
  if (!text) return;
  
  navigator.clipboard.writeText(text)
    .then(() => {
      // Success feedback could be added here
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}

/**
 * Clear input and output fields
 */
function clearInputOutput() {
  inputValue.value = '';
  outputValue.value = '';
}

/**
 * Save current operation to history
 */
function saveToHistory() {
  if (!inputValue.value || !outputValue.value) return;
  
  const historyItem = {
    mode: mode.value,
    input: inputValue.value,
    output: outputValue.value,
    timestamp: new Date().toISOString()
  };
  
  addToHistory(historyItem);
}

/**
 * Load operation from history
 * @param {HistoryItem} item - The history item to load
 */
function loadFromHistory(item) {
  if (!item) return;
  
  mode.value = item.mode;
  inputValue.value = item.input;
  outputValue.value = item.output;
}

// History persistence functions
/**
 * Sauvegarde l'historique dans le localStorage
 */
function saveHistoryToStorage() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems.value));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
}

/**
 * Charge l'historique depuis le localStorage
 */
function loadHistoryFromStorage() {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      historyItems.value = JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
  }
}

/**
 * Ajoute un élément à l'historique et persiste les changements
 * @param {HistoryItem} item - L'élément à ajouter
 */
function addToHistory(item) {
  // Check if identical item already exists
  const exists = historyItems.value.some(
    historyItem => 
      historyItem.mode === item.mode && 
      historyItem.input === item.input && 
      historyItem.output === item.output
  );
  
  if (!exists) {
    historyItems.value.unshift(item);
    
    // Limiter la taille de l'historique
    if (historyItems.value.length > MAX_HISTORY_ITEMS) {
      historyItems.value = historyItems.value.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Persister dans le localStorage
    saveHistoryToStorage();
  }
}

/**
 * Affiche la boîte de dialogue de confirmation pour effacer l'historique
 */
function confirmClearHistory() {
  clearHistoryDialog.value = true;
}

/**
 * Efface tout l'historique
 */
function clearHistory() {
  historyItems.value = [];
  saveHistoryToStorage();
  clearHistoryDialog.value = false;
}

/**
 * Formate le timestamp pour l'affichage
 * @param {string} timestamp - Le timestamp ISO à formater
 * @returns {string} - Le timestamp formaté
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    
    // Format: "Today 15:30" or "2022-01-15 15:30"
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
  } catch (error) {
    return timestamp;
  }
}

/**
 * Trim text to a specific length
 * @param {string} text - The text to trim
 * @param {number} maxLength - The maximum length
 * @returns {string} - The trimmed text
 */
function trimText(text = '', maxLength = 30) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
</script>

<style scoped lang="scss">
.base64-tool {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  h1 {
    margin-bottom: 1.5rem;
    color: var(--text-color);
  }
}

.base64-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  
  @media screen and (min-width: 992px) {
    flex-direction: row;
  }
}

/* Converter Panel */
.converter-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  
  @media screen and (min-width: 992px) {
    width: 65%;
  }
}

.mode-selector {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background-color: var(--surface-section);
  border-radius: var(--border-radius);
  justify-content: center;
  border: 1px solid var(--surface-border);
}

.mode-radio-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.mode-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-color);
}

.input-output-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media screen and (min-width: 768px) {
    flex-direction: row;
    align-items: stretch;
  }
}

.input-container, .output-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: var(--text-secondary-color);
    font-weight: 600;
  }
}

.swap-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0.5rem;
}

.textarea-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.text-area {
  width: 100%;
  min-height: 200px;
  resize: vertical;
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
  font-family: var(--font-family-monospace, monospace);
  padding: 0.75rem;
  line-height: 1.5;
  background-color: var(--surface-ground);
  color: var(--text-color);
  padding-bottom: 2.5rem; /* Make space for the copy button */
}

.copy-button {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  width: 2rem !important;
  height: 2rem !important;
  font-size: 0.75rem;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

/* History Panel */
.history-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  
  @media screen and (min-width: 992px) {
    width: 35%;
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--text-color);
  }
}

.no-history {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-secondary-color);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 500px;
  padding-right: 0.5rem;
}

.history-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background-color: var(--surface-section);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--surface-border);
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.history-item-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.history-mode {
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: bold;
  
  &.encode {
    background-color: var(--primary-100);
    color: var(--primary-700);
  }
  
  &.decode {
    background-color: var(--primary-50);
    color: var(--primary-800);
  }
}

.history-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-family-monospace, monospace);
}

.history-item-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: var(--text-secondary-color);
}

.history-timestamp {
  font-style: italic;
}
</style> 
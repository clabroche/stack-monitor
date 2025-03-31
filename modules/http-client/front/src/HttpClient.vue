<template>
  <div class="http-client-root">
    <h1>HTTP Client</h1>
    <SectionCmp>
      <div class="http-client-container">
        <!-- Request Section -->
        <div class="request-panel">
          <!-- URL Bar -->
          <div class="request-header">
            <div class="url-container">
              <div class="method-selector">
                <Dropdown v-model="method" :options="methods" class="method-dropdown" />
              </div>
              <InputText v-model="url" placeholder="Enter request URL" class="url-input" />
              <Button label="Send" icon="fas fa-paper-plane" @click="sendRequest" :loading="loading" />
            </div>
          </div>

          <!-- Request Details Tabs -->
          <TabView class="request-tabs">
            <TabPanel header="Headers" value="headers">
              <div class="headers-container">
                <div v-for="(header, index) in headers" :key="index" class="header-row">
                  <InputText v-model="header.key" placeholder="Header" class="header-key" />
                  <InputText v-model="header.value" placeholder="Value" class="header-value" />
                  <Button icon="fas fa-times" severity="danger" text @click="removeHeader(index)" class="delete-btn" />
                </div>
                <Button label="Add Header" icon="fas fa-plus" @click="addHeader" text class="add-btn" />
              </div>
            </TabPanel>
            <TabPanel header="Params" value="params">
              <div class="params-container">
                <div v-for="(param, index) in params" :key="index" class="param-row">
                  <InputText v-model="param.key" placeholder="Parameter" class="param-key" />
                  <InputText v-model="param.value" placeholder="Value" class="param-value" />
                  <Button icon="fas fa-times" severity="danger" text @click="removeParam(index)" class="delete-btn" />
                </div>
                <Button label="Add Parameter" icon="fas fa-plus" @click="addParam" text class="add-btn" />
              </div>
            </TabPanel>
            <TabPanel header="Body" value="body">
              <div class="body-container">
                <!-- Body Type Selection -->
                <div class="body-type-selector">
                  <div class="body-radio-group">
                    <RadioButton v-model="bodyType" value="none" inputId="body-none" />
                    <label for="body-none">None</label>
                  </div>
                  <div class="body-radio-group">
                    <RadioButton v-model="bodyType" value="json" inputId="body-json" />
                    <label for="body-json">JSON</label>
                  </div>
                  <div class="body-radio-group">
                    <RadioButton v-model="bodyType" value="form" inputId="body-form" />
                    <label for="body-form">Form</label>
                  </div>
                  <div class="body-radio-group">
                    <RadioButton v-model="bodyType" value="text" inputId="body-text" />
                    <label for="body-text">Text</label>
                  </div>
                </div>

                <!-- Body Content -->
                <div class="body-content">
                  <div v-if="bodyType === 'json'" class="json-body">
                    <Editor v-model="jsonBody" language="json" :height="350" />
                  </div>
                  <div v-else-if="bodyType === 'form'" class="form-body">
                    <div v-for="(field, index) in formFields" :key="index" class="form-field-row">
                      <InputText v-model="field.key" placeholder="Field" class="form-field-key" />
                      <InputText v-model="field.value" placeholder="Value" class="form-field-value" />
                      <Button icon="fas fa-times" severity="danger" text @click="removeFormField(index)" class="delete-btn" />
                    </div>
                    <Button label="Add Field" icon="fas fa-plus" @click="addFormField" text class="add-btn" />
                  </div>
                  <div v-else-if="bodyType === 'text'" class="text-body">
                    <Textarea v-model="textBody" rows="15" class="text-area" />
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>

        <!-- Response Section -->
        <div class="response-panel">
          <TabView class="response-tabs">
            <TabPanel header="Response" value="response">
              <div v-if="response" class="response-content">
                <!-- Response Summary -->
                <div class="response-info">
                  <div class="status" :class="getStatusClass(response?.status || 0)">
                    {{ response?.status || '-' }} {{ response?.statusText || '' }}
                  </div>
                  <div class="time">
                    {{ response?.responseTime || 0 }}ms
                  </div>
                </div>
                
                <!-- Response Details -->
                <TabView>
                  <TabPanel header="Body" value="response-body">
                    <div class="response-body">
                      <div v-if="isJsonResponse" class="json-response">
                        <Editor v-model="prettyResponse" language="json" :height="450" readOnly />
                      </div>
                      <pre v-else class="text-response">{{ responseBodyText }}</pre>
                    </div>
                  </TabPanel>
                  <TabPanel header="Headers" value="response-headers">
                    <div class="response-headers">
                      <div v-for="(value, key) in response?.headers || {}" :key="key" class="header-item">
                        <div class="header-key">{{ key }}:</div>
                        <div class="header-value">{{ value }}</div>
                      </div>
                    </div>
                  </TabPanel>
                </TabView>
              </div>
              <div v-else class="no-response">
                <div class="empty-state">
                  <i class="fas fa-exchange-alt empty-icon"></i>
                  <p>Send a request to see the response</p>
                </div>
              </div>
            </TabPanel>
            <TabPanel header="History" value="history">
              <div class="history-container">
                <div class="history-header">
                  <h3>Request History</h3>
                  <Button 
                    label="Clear History" 
                    icon="fas fa-trash" 
                    severity="danger" 
                    outlined 
                    @click="confirmClearHistory" 
                    :disabled="!historyItems.length" 
                  />
                </div>
                
                <div v-if="!historyItems.length" class="no-history">
                  <div class="empty-state">
                    <i class="fas fa-history empty-icon"></i>
                    <p>No requests yet</p>
                  </div>
                </div>
                <div v-else class="history-list">
                  <div v-for="(item, index) in historyItems" :key="index" class="history-item" @click="loadFromHistory(item)">
                    <div class="history-item-header">
                      <div class="history-method" :class="item.method?.toLowerCase()">{{ item.method }}</div>
                      <div class="history-url">{{ item.url }}</div>
                      <div v-if="item.response" class="history-status" :class="getStatusClass(item.response?.status || 0)">
                        {{ item.response?.status }}
                      </div>
                    </div>
                    <div class="history-item-footer">
                      <div class="history-timestamp">{{ formatTimestamp(item.timestamp) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>
    </SectionCmp>
    
    <!-- Confirmation Dialog -->
    <Dialog v-model:visible="clearHistoryDialog" header="Clear History" :modal="true" :closable="false" :style="{ width: '400px' }" :closeOnEscape="false">
      <p>Are you sure you want to clear all request history? This action cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" icon="fas fa-times" outlined @click="clearHistoryDialog = false" />
        <Button label="Clear" icon="fas fa-trash" severity="danger" @click="clearHistory" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import RadioButton from 'primevue/radiobutton';
import Textarea from 'primevue/textarea';
import Editor from '../../../../fronts/app/src/components/Editor.vue';
import Dialog from 'primevue/dialog';

// Type definitions pour résoudre les erreurs de linter
/**
 * @typedef {Object} RequestData
 * @property {string} method
 * @property {string} url
 * @property {Object} headers
 * @property {Object} params
 * @property {any} body
 */

/**
 * @typedef {Object} ResponseData
 * @property {number} status
 * @property {string} statusText
 * @property {Object} headers
 * @property {any} data
 * @property {number} responseTime
 * @property {boolean} [error]
 */

/**
 * @typedef {Object} HistoryItem
 * @property {string} method
 * @property {string} url
 * @property {Object} headers
 * @property {Object} params
 * @property {any} body
 * @property {ResponseData} response
 * @property {string} timestamp
 */

// Constants
const HISTORY_STORAGE_KEY = 'http-client-history';
const MAX_HISTORY_ITEMS = 20;

// Request data
const method = ref('GET');
const url = ref('');
const headers = ref([{ key: '', value: '' }]);
const params = ref([{ key: '', value: '' }]);
const bodyType = ref('none');
const jsonBody = ref('{\n  \n}');
const textBody = ref('');
const formFields = ref([{ key: '', value: '' }]);

// Response data
/** @type {import('vue').Ref<ResponseData|null>} */
const response = ref(null);
const loading = ref(false);
/** @type {import('vue').Ref<HistoryItem[]>} */
const historyItems = ref([]);

// UI states
const clearHistoryDialog = ref(false);

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

// Load history from localStorage on component mount
onMounted(() => {
  loadHistoryFromStorage();
});

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
  historyItems.value.unshift(item);
  
  // Limiter la taille de l'historique
  if (historyItems.value.length > MAX_HISTORY_ITEMS) {
    historyItems.value = historyItems.value.slice(0, MAX_HISTORY_ITEMS);
  }
  
  // Persister dans le localStorage
  saveHistoryToStorage();
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

// Computed properties
const isJsonResponse = computed(() => {
  if (!response.value || !response.value.data) return false;
  return typeof response.value.data === 'object';
});

const prettyResponse = computed(() => {
  if (!response.value || !response.value.data) return '';
  if (typeof response.value.data === 'object') {
    return JSON.stringify(response.value.data, null, 2);
  }
  return response.value.data;
});

const responseBodyText = computed(() => {
  if (!response.value || !response.value.data) return '';
  return typeof response.value.data === 'string' 
    ? response.value.data 
    : JSON.stringify(response.value.data);
});

// Methods
function addHeader() {
  headers.value.push({ key: '', value: '' });
}

function removeHeader(index) {
  headers.value.splice(index, 1);
  if (headers.value.length === 0) {
    addHeader();
  }
}

function addParam() {
  params.value.push({ key: '', value: '' });
}

function removeParam(index) {
  params.value.splice(index, 1);
  if (params.value.length === 0) {
    addParam();
  }
}

function addFormField() {
  formFields.value.push({ key: '', value: '' });
}

function removeFormField(index) {
  formFields.value.splice(index, 1);
  if (formFields.value.length === 0) {
    addFormField();
  }
}

function getStatusClass(status) {
  if (!status) return '';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
}

function prepareHeaders() {
  const result = {};
  headers.value.forEach(header => {
    if (header.key.trim() && header.value.trim()) {
      result[header.key.trim()] = header.value.trim();
    }
  });
  return result;
}

function prepareParams() {
  const result = {};
  params.value.forEach(param => {
    if (param.key.trim()) {
      result[param.key.trim()] = param.value.trim();
    }
  });
  return result;
}

function prepareBody() {
  if (bodyType.value === 'none') return null;
  if (bodyType.value === 'json') {
    try {
      return JSON.parse(jsonBody.value);
    } catch (e) {
      // Return as is if not valid JSON
      return jsonBody.value;
    }
  }
  if (bodyType.value === 'text') return textBody.value;
  if (bodyType.value === 'form') {
    const formData = {};
    formFields.value.forEach(field => {
      if (field.key.trim()) {
        formData[field.key.trim()] = field.value;
      }
    });
    return formData;
  }
  return null;
}

/**
 * Prépare l'URL en ajoutant https:// si nécessaire
 * @param {string} urlString - L'URL à préparer
 * @returns {string} L'URL préparée
 */
function prepareUrl(urlString) {
  if (!urlString) return '';
  
  // Si l'URL commence par http:// ou https://, on la retourne telle quelle
  if (/^https?:\/\//i.test(urlString)) {
    return urlString;
  }
  
  // Si l'URL contient :// (autre protocole), on la retourne telle quelle
  if (urlString.includes('://')) {
    return urlString;
  }
  
  // Sinon on ajoute https://
  return `https://${urlString}`;
}

async function sendRequest() {
  if (!url.value) return;
  
  loading.value = true;
  
  try {
    const preparedUrl = prepareUrl(url.value);
    
    const requestData = {
      method: method.value,
      url: preparedUrl,
      headers: prepareHeaders(),
      params: prepareParams(),
      body: prepareBody()
    };
    
    const { data } = await axios.post('/http-client/request', requestData);
    response.value = data;
    
    // Add to history with persistence
    const historyItem = {
      method: method.value,
      url: preparedUrl,
      headers: prepareHeaders(),
      params: prepareParams(),
      body: prepareBody(),
      response: data,
      timestamp: new Date().toISOString() // Ajouter un timestamp pour le tri
    };
    
    addToHistory(historyItem);
    
  } catch (error) {
    console.error('Request failed:', error);
  } finally {
    loading.value = false;
  }
}

function loadFromHistory(item) {
  if (!item) return;
  
  method.value = item.method || 'GET';
  url.value = item.url || '';
  
  // Set headers
  headers.value = [];
  if (item.headers && typeof item.headers === 'object') {
    Object.entries(item.headers).forEach(([key, value]) => {
      headers.value.push({ key, value });
    });
  }
  if (headers.value.length === 0) {
    headers.value.push({ key: '', value: '' });
  }
  
  // Set params
  params.value = [];
  if (item.params && typeof item.params === 'object') {
    Object.entries(item.params).forEach(([key, value]) => {
      params.value.push({ key, value });
    });
  }
  if (params.value.length === 0) {
    params.value.push({ key: '', value: '' });
  }
  
  // Set body
  if (!item.body) {
    bodyType.value = 'none';
  } else if (typeof item.body === 'string') {
    bodyType.value = 'text';
    textBody.value = item.body;
  } else if (typeof item.body === 'object') {
    bodyType.value = 'json';
    jsonBody.value = JSON.stringify(item.body, null, 2);
  }
  
  // Set response
  response.value = item.response;
}
</script>

<style scoped lang="scss">
.http-client-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.http-client-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  
  @media screen and (min-width: 992px) {
    flex-direction: row;
  }
}

/* Request Panel */
.request-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--system-backgroundColor);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  @media screen and (min-width: 992px) {
    width: 50%;
  }
}

.request-header {
  padding: 1rem;
  background-color: var(--system-secondary-backgroundColor);
  border-bottom: 1px solid var(--system-borderColor);
}

.url-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.method-dropdown {
  width: 110px;
  flex-shrink: 0;
}

.url-input {
  flex: 1;
}

.request-tabs {
  flex: 1;
  overflow: hidden;
}

/* Response Panel */
.response-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--system-backgroundColor);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  min-height: 300px;
  overflow: hidden;
  
  @media screen and (min-width: 992px) {
    width: 50%;
  }
}

.response-tabs {
  flex: 1;
  overflow: hidden;
}

.response-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: var(--system-secondary-backgroundColor);
  border-radius: 6px;
}

.status {
  font-weight: bold;
  font-size: 1.1rem;
}

.time {
  font-family: monospace;
  background: var(--system-backgroundColor);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Containers and Rows */
.headers-container, .params-container, .form-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
}

.header-row, .param-row, .form-field-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.header-key, .param-key, .form-field-key {
  flex: 1;
}

.header-value, .param-value, .form-field-value {
  flex: 2;
}

.delete-btn {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.add-btn {
  align-self: flex-start;
  margin-top: 0.5rem;
}

/* Body Styling */
.body-container {
  padding: 0.5rem;
}

.body-type-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--system-secondary-backgroundColor);
  border-radius: 6px;
}

.body-radio-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.body-content {
  border: 1px solid var(--system-borderColor);
  border-radius: 6px;
  overflow: hidden;
  min-height: 350px;
}

.text-area {
  width: 100%;
  border: none;
  resize: vertical;
  min-height: 350px;
}

/* Response Details */
.response-body {
  margin-top: 0.5rem;
}

.text-response {
  background-color: var(--system-secondary-backgroundColor);
  padding: 1rem;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 450px;
  min-height: 200px;
  overflow: auto;
}

.response-headers {
  margin-top: 0.5rem;
}

.header-item {
  display: flex;
  padding: 0.75rem;
  border-bottom: 1px solid var(--system-borderColor);
  background-color: var(--system-secondary-backgroundColor);
  margin-bottom: 0.25rem;
  border-radius: 4px;
}

.header-item .header-key {
  font-weight: bold;
  margin-right: 0.5rem;
  min-width: 150px;
  flex: 0 0 auto;
}

/* Status Colors */
.success {
  color: #4caf50;
}

.redirect {
  color: #ff9800;
}

.client-error {
  color: #f44336;
}

.server-error {
  color: #9c27b0;
}

/* Method Colors */
.get {
  color: #2196f3;
}

.post {
  color: #4caf50;
}

.put {
  color: #ff9800;
}

.delete {
  color: #f44336;
}

.patch {
  color: #9c27b0;
}

/* Empty States */
.no-response, .no-history {
  height: 300px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--system-secondary-color);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* History */
.history-container {
  padding: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
  }
}

.history-list {
  margin-top: 1rem;
}

.history-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  background-color: var(--system-secondary-backgroundColor);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.history-item-header {
  display: flex;
  align-items: center;
}

.history-item-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: var(--system-secondary-color);
}

.history-timestamp {
  font-style: italic;
}

.history-method {
  font-weight: bold;
  min-width: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.history-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 1rem;
}

.history-status {
  flex-shrink: 0;
  font-weight: bold;
}

/* Tab Panel Override */
:deep(.p-tabview-panels) {
  padding: 1rem;
}

:deep(.p-tabview-nav) {
  border-bottom-color: var(--system-borderColor);
}

:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  border-color: var(--system-primary-color);
  color: var(--system-primary-color);
}

:deep(.p-tabview-nav-link) {
  padding: 0.75rem 1rem;
}

/* Fix editor height */
:deep(.monaco-editor) {
  min-height: 350px;
}
</style> 
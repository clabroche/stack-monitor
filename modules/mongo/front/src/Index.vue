<template>
  <div class="mongo-root">
    <h1>MongoDB Toolbox</h1>
    <div class="sections">
      <section-cmp header="ObjectId Generator">
        <div class="section-content">
          <h2>ObjectId('{{ uuid }}')</h2>
          <div class="actions">
            <button @click="generate">
              <i class="fas fa-random"></i>
              Generate New
            </button>
            <button @click="copyToClipboard(uuid)" class="secondary">
              <i class="fas fa-copy"></i>
              Copy
            </button>
          </div>
        </div>
      </section-cmp>

      <section-cmp header="Validate ObjectId">
        <div class="section-content">
          <input type="text" v-model="validateObjectId" placeholder="Enter ObjectId to validate">
          <div class="validation-result" :class="{ valid: validationResult, invalid: validationResult === false }">
            <i v-if="validationResult === true" class="fas fa-check"></i>
            <i v-if="validationResult === false" class="fas fa-times"></i>
            <span v-if="validationResult === true">Valid ObjectId</span>
            <span v-if="validationResult === false">Invalid ObjectId</span>
          </div>
        </div>
      </section-cmp>

      <section-cmp header="Decode ObjectId">
        <div class="section-content">
          <input type="text" v-model="decodeObjectId" placeholder="Enter ObjectId to decode">
          <div v-if="decodedData && decodedData.isValid" class="decoded-data">
            <div class="data-row">
              <span class="label">Created:</span>
              <span class="value">{{ formatDate(decodedData.date) }}</span>
            </div>
            <div class="data-row">
              <span class="label">Timestamp:</span>
              <span class="value">{{ decodedData.timestamp }}</span>
            </div>
            <div class="data-row">
              <span class="label">Machine ID:</span>
              <span class="value">{{ decodedData.machineId }}</span>
            </div>
            <div class="data-row">
              <span class="label">Process ID:</span>
              <span class="value">{{ decodedData.processId }}</span>
            </div>
            <div class="data-row">
              <span class="label">Counter:</span>
              <span class="value">{{ decodedData.counter }}</span>
            </div>
            <details>
              <summary>Format Options</summary>
              <div class="data-row">
                <span class="label">Hex:</span>
                <span class="value">{{ decodedData.format.hex }}</span>
              </div>
              <div class="data-row">
                <span class="label">Base64:</span>
                <span class="value">{{ decodedData.format.base64 }}</span>
              </div>
            </details>
          </div>
          <div v-else-if="decodedData && !decodedData.isValid" class="error-message">
            {{ decodedData.error }}
          </div>
        </div>
      </section-cmp>

      <section-cmp header="Create ObjectId from Date">
        <div class="section-content">
          <input type="datetime-local" v-model="dateInput">
          <div class="date-objectid">
            <span>ObjectId('{{ dateObjectId }}')</span>
            <Button @click="copyToClipboard(dateObjectId)" class="secondary small">
              <i class="fas fa-copy"></i>
            </Button>
          </div>
        </div>
      </section-cmp>

      <section-cmp header="Compare ObjectIds">
        <div class="section-content compare-section">
          <div class="compare-inputs">
            <input type="text" v-model="compareId1" placeholder="First ObjectId">
            <input type="text" v-model="compareId2" placeholder="Second ObjectId">
            <button @click="compareObjectIds" class="primary">Compare</button>
          </div>
          
          <div v-if="comparisonResult && comparisonResult.isValid" class="comparison-results">
            <div class="data-row">
              <span class="label">Time Difference:</span>
              <span class="value">{{ comparisonResult.timeDifference.humanReadable }}</span>
            </div>
            <div class="data-row">
              <span class="label">Same Server:</span>
              <span class="value" :class="{ positive: comparisonResult.sameServer, negative: !comparisonResult.sameServer }">
                {{ comparisonResult.sameServer ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="data-row">
              <span class="label">Same Process:</span>
              <span class="value" :class="{ positive: comparisonResult.sameProcess, negative: !comparisonResult.sameProcess }">
                {{ comparisonResult.sameProcess ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="data-row">
              <span class="label">Counter Difference:</span>
              <span class="value">{{ comparisonResult.counterDifference }}</span>
            </div>
          </div>
          <div v-else-if="comparisonResult && !comparisonResult.isValid" class="error-message">
            {{ comparisonResult.error }}
          </div>
        </div>
      </section-cmp>

      <section-cmp header="Test MongoDB Connection">
        <div class="section-content">
          <input type="text" v-model="connectionString" placeholder="mongodb://username:password@host:port/database">
          <button @click="testConnection" class="primary">Test Connection</button>
          
          <div v-if="connectionResult" class="connection-results">
            <div v-if="connectionResult.success" class="connection-success">
              <div class="data-row">
                <span class="label">Status:</span>
                <span class="value positive">Connected Successfully</span>
              </div>
              <div class="data-row">
                <span class="label">MongoDB Version:</span>
                <span class="value">{{ connectionResult.version }}</span>
              </div>
              
              <details>
                <summary>Databases ({{ connectionResult.databases.length }})</summary>
                <div v-for="(db, index) in connectionResult.databases" :key="index" class="database-item">
                  <strong>{{ db.name }}</strong>
                  <span>({{ formatSize(db.sizeOnDisk) }})</span>
                  <span v-if="db.empty" class="empty-tag">Empty</span>
                </div>
              </details>
            </div>
            <div v-else class="connection-error">
              <div class="data-row">
                <span class="label">Status:</span>
                <span class="value negative">Connection Failed</span>
              </div>
              <div class="data-row">
                <span class="label">Error:</span>
                <span class="value">{{ connectionResult.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </section-cmp>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import dayjs from 'dayjs';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';

// Define TypeScript interfaces for our data structures
/**
 * @typedef {Object} DecodedObjectId
 * @property {boolean} isValid
 * @property {string} [error]
 * @property {number} [timestamp]
 * @property {Date} [date]
 * @property {string} [machineId]
 * @property {string} [processId]
 * @property {string} [counter]
 * @property {{hex: string, binary: string, base64: string}} [format]
 */

/**
 * @typedef {Object} ComparisonResult
 * @property {boolean} isValid
 * @property {string} [error]
 * @property {{seconds: number, milliseconds: number, humanReadable: string}} [timeDifference]
 * @property {boolean} [sameServer]
 * @property {boolean} [sameProcess]
 * @property {number} [counterDifference]
 */

/**
 * @typedef {Object} ConnectionResult
 * @property {boolean} success
 * @property {string} [error]
 * @property {string} [version]
 * @property {Array<{name: string, sizeOnDisk: number, empty: boolean}>} [databases]
 */

// ObjectId Generator
/** @type {import('vue').Ref<string>} */
const uuid = ref('');
const generate = async () => {
  const { data } = await axios.get('/mongo/generate');
  uuid.value = data;
};

// ObjectId Validation
/** @type {import('vue').Ref<string>} */
const validateObjectId = ref('');
/** @type {import('vue').Ref<boolean | null>} */
const validationResult = ref(null);
watchEffect(async () => {
  if (!validateObjectId.value) {
    validationResult.value = null;
    return;
  }
  
  try {
    const { data } = await axios.post('/mongo/validate', {
      objectId: validateObjectId.value
    });
    validationResult.value = data.isValid;
  } catch (error) {
    // Cast to boolean explicitly to match the type
    validationResult.value = false;
  }
});

// ObjectId Decoder
/** @type {import('vue').Ref<string>} */
const decodeObjectId = ref('');
/** @type {import('vue').Ref<DecodedObjectId | null>} */
const decodedData = ref(null);
watchEffect(async () => {
  if (!decodeObjectId.value) {
    decodedData.value = null;
    return;
  }
  
  try {
    const { data } = await axios.post('/mongo/decode', {
      objectId: decodeObjectId.value
    });
    decodedData.value = data;
  } catch (error) {
    // Create a properly typed error object
    decodedData.value = {
      isValid: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
});

// Date to ObjectId
/** @type {import('vue').Ref<string>} */
const dateInput = ref(dayjs().format('YYYY-MM-DDTHH:mm'));
/** @type {import('vue').Ref<string>} */
const dateObjectId = ref('');
watchEffect(async () => {
  if (!dateInput.value) return;
  
  try {
    const { data } = await axios.post('/mongo/from-date', {
      date: dateInput.value
    });
    dateObjectId.value = data.objectId;
  } catch (error) {
    dateObjectId.value = 'Error generating ObjectId';
  }
});

// ObjectId Comparison
/** @type {import('vue').Ref<string>} */
const compareId1 = ref('');
/** @type {import('vue').Ref<string>} */
const compareId2 = ref('');
/** @type {import('vue').Ref<ComparisonResult | null>} */
const comparisonResult = ref(null);
const compareObjectIds = async () => {
  if (!compareId1.value || !compareId2.value) {
    comparisonResult.value = {
      isValid: false,
      error: 'Both ObjectIds are required'
    };
    return;
  }
  
  try {
    const { data } = await axios.post('/mongo/compare', {
      objectId1: compareId1.value,
      objectId2: compareId2.value
    });
    comparisonResult.value = data;
  } catch (error) {
    comparisonResult.value = {
      isValid: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
};

// MongoDB Connection Test
/** @type {import('vue').Ref<string>} */
const connectionString = ref('');
/** @type {import('vue').Ref<ConnectionResult | null>} */
const connectionResult = ref(null);
const testConnection = async () => {
  if (!connectionString.value) {
    connectionResult.value = {
      success: false,
      error: 'Connection string is required'
    };
    return;
  }
  
  try {
    const { data } = await axios.post('/mongo/test-connection', {
      connectionString: connectionString.value
    });
    connectionResult.value = data;
  } catch (error) {
    connectionResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
};

// Helper functions
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

// Initialize
generate();
</script>

<style scoped lang="scss">
.mongo-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--primary-color-dark);
  }
  
  &.secondary {
    background-color: var(--secondary-color);
    
    &:hover {
      background-color: var(--secondary-color-dark);
    }
  }
  
  &.small {
    padding: 4px 8px;
    font-size: 0.8em;
  }
}

input {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  width: 100%;
  max-width: 800px;
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
}

.validation-result {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  
  &.valid {
    color: var(--success-color, #4caf50);
  }
  
  &.invalid {
    color: var(--error-color, #f44336);
  }
}

.decoded-data, .comparison-results, .connection-results {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
  background-color: var(--card-bg-color, rgba(0, 0, 0, 0.03));
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    font-weight: bold;
    color: var(--text-muted, #666);
  }
  
  .positive {
    color: var(--success-color, #4caf50);
  }
  
  .negative {
    color: var(--error-color, #f44336);
  }
}

.compare-section {
  .compare-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.date-objectid {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: monospace;
  padding: 8px;
  background-color: var(--code-bg-color, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
}

.error-message {
  color: var(--error-color, #f44336);
  padding: 10px;
  background-color: var(--error-bg-color, rgba(244, 67, 54, 0.1));
  border-radius: 4px;
}

details {
  margin-top: 10px;
  
  summary {
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 5px;
  }
}

.database-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid var(--border-color, #ddd);
  
  .empty-tag {
    background-color: var(--tag-bg-color, #eee);
    border-radius: 3px;
    padding: 2px 5px;
    font-size: 0.8em;
    color: var(--text-muted, #666);
  }
}
</style>

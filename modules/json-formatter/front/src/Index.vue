<template>
  <div class="json-root">
    <h1>JSON Formatter</h1>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'edit' }" @click="activeTab = 'edit'">
        <i class="pi pi-pencil"></i> Edit JSON
      </div>
      <div class="tab" :class="{ active: activeTab === 'convert' }" @click="activeTab = 'convert'">
        <i class="pi pi-sync"></i> Convert Format
      </div>
      <div class="tab" :class="{ active: activeTab === 'validate' }" @click="activeTab = 'validate'">
        <i class="pi pi-check-circle"></i> Validate Schema
      </div>
      <div class="tab" :class="{ active: activeTab === 'analyze' }" @click="activeTab = 'analyze'">
        <i class="pi pi-chart-bar"></i> Analyze JSON
      </div>
      <div class="tab" :class="{ active: activeTab === 'query' }" @click="activeTab = 'query'">
        <i class="pi pi-search"></i> Query JSON
      </div>
    </div>

    <!-- EDITOR TAB -->
    <section-cmp v-if="activeTab === 'edit'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JSON Editor</h3>
          <editor
            v-model="code"
            language="json"
            class="editor"
          />
          <div class="actions">
            <Tag 
              :severity="isValid ? 'success' : 'danger'" 
              :value="isValid ? 'Valid JSON' : 'Invalid JSON'"
            />
            <Button v-if="!isValid" label="Try to repair JSON" icon="pi pi-wrench" @click="repairJson" severity="warning" size="small" />
          </div>
        </div>
        <div class="right-panel">
          <div class="view-options">
            <div class="option">
              <Checkbox v-model="showRaw" :binary="true" id="showRaw" />
              <label for="showRaw" class="ml-2">Show Raw</label>
            </div>
          </div>
          
          <div v-if="showRaw" class="raw-json p-3 border-1 border-round surface-200 overflow-auto">
            <pre v-html="raw"></pre>
          </div>
          <div v-else>
            <TreeTable :value="treeTableData" :expandedKeys="expandedKeys" class="json-tree" :scrollable="true">
              <Column field="key" header="Key" expander>
                <template #body="slotProps">
                  <span :class="{'text-primary': slotProps.node.data.type === 'key'}">{{ slotProps.node.data.key }}</span>
                </template>
              </Column>
              <Column field="value" header="Value">
                <template #body="slotProps">
                  <span :class="getValueClass(slotProps.node.data)">{{ slotProps.node.data.value }}</span>
                  <Button 
                    v-if="slotProps.node.data.value" 
                    icon="pi pi-copy"
                    text
                    rounded
                    severity="secondary"
                    size="small"
                    @click="copy(slotProps.node.data.value)" 
                    class="p-button-sm ml-2" 
                  />
                </template>
              </Column>
              <Column field="type" header="Type">
                <template #body="slotProps">
                  <Tag :severity="getTypeSeverity(slotProps.node.data.type)">{{ slotProps.node.data.type }}</Tag>
                </template>
              </Column>
            </TreeTable>
          </div>
        </div>
      </div>
    </section-cmp>

    <!-- CONVERT TAB -->
    <section-cmp v-if="activeTab === 'convert'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JSON Input</h3>
          <editor
            v-model="code"
            language="json"
            class="editor"
          />
        </div>
        <div class="right-panel">
          <div class="conversion-options">
            <h3>Output</h3>
            <div class="options">
              <Dropdown v-model="convertFormat" :options="convertOptions" optionLabel="name" optionValue="value" class="w-10rem mr-2" />
              <Button label="Convert" icon="pi pi-refresh" @click="convert" />
            </div>
          </div>
          <editor
            v-model="convertedOutput"
            :language="convertFormat === 'yaml' ? 'yaml' : 'xml'"
            class="editor"
          />
        </div>
      </div>
    </section-cmp>
    
    <!-- VALIDATE TAB -->
    <section-cmp v-if="activeTab === 'validate'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JSON Data</h3>
          <editor
            v-model="code"
            language="json"
            class="editor"
          />
        </div>
        <div class="right-panel">
          <h3>JSON Schema</h3>
          <editor
            v-model="jsonSchema"
            language="json"
            class="editor"
          />
          <div class="validation-actions">
            <Button label="Validate against schema" icon="pi pi-check-circle" @click="validateSchema" size="large" />
          </div>
          <div v-if="schemaValidationResult" class="validation-results">
            <Message :severity="schemaValidationResult.valid ? 'success' : 'error'" :sticky="true">
              {{ schemaValidationResult.valid ? 'Schema validation passed!' : 'Schema validation failed!' }}
            </Message>
            
            <div v-if="schemaValidationResult.valid === false" class="validation-errors">
              <h4>Validation Errors:</h4>
              <ul class="list-none p-0 m-0">
                <li v-for="(error, index) in schemaValidationResult.errors" :key="index" class="mb-2">
                  <Message severity="warn" :sticky="true">
                    <b>{{ error.instancePath || 'Root' }}:</b> {{ error.message }}
                  </Message>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section-cmp>
    
    <!-- ANALYZE TAB -->
    <section-cmp v-if="activeTab === 'analyze'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JSON Data</h3>
          <editor
            v-model="code"
            language="json"
            class="editor"
          />
        </div>
        <div class="right-panel">
          <div class="flex justify-content-between align-items-center">
            <h3>Statistics</h3>
            <Button label="Analyze JSON" icon="pi pi-chart-bar" @click="analyzeJson" />
          </div>
          <div v-if="jsonStats" class="p-4 border-1 border-round surface-100 mt-2">
            <DataTable :value="jsonStatsForTable" stripedRows>
              <Column field="property" header="Property"></Column>
              <Column field="value" header="Value"></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </section-cmp>
    
    <!-- QUERY TAB -->
    <section-cmp v-if="activeTab === 'query'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JSON Data</h3>
          <editor
            v-model="code"
            language="json"
            class="editor"
          />
        </div>
        <div class="right-panel">
          <h3>JSONPath Query</h3>
          <div class="p-inputgroup mb-3">
            <InputText 
              v-model="jsonPathQuery" 
              placeholder="$.store.book[*].author" 
              class="w-full" 
              @keydown.enter="queryJson"
            />
            <Button label="Execute Query" icon="pi pi-search" @click="queryJson" />
          </div>
          <h3>Results</h3>
          <div v-if="queryResults">
            <editor
              v-model="queryResultsFormatted"
              language="json"
              class="editor-sm"
            />
          </div>
          <div v-else class="p-4 surface-200 border-round text-center text-500 text-italic">
            <i class="pi pi-info-circle mr-2"></i>No query results to display
          </div>
        </div>
      </div>
    </section-cmp>
    
    <!-- Modal for tree visualization -->
    <Dialog v-model:visible="showJsonCrack" header="JSON Visualizer" modal maximizable :style="{width: '90vw'}" :contentStyle="{height: '80vh'}">
      <iframe width="100%" height="100%" ref="jsoncrackEmbed" id="jsoncrackEmbed" :src="`https://jsoncrack.com/widget`" />
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { jsonrepair } from 'jsonrepair';
import axios from 'axios';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import notification from '../../../../fronts/app/src/helpers/notification';

// PrimeVue Components
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import TreeTable from 'primevue/treetable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import SpeedDial from 'primevue/speeddial';

// Types
/** @typedef {{valid: boolean, errors: Array<{instancePath: string, message: string}>}} ValidationResult */
/** @typedef {{size: number, stringifiedSize: number, depth: number, keys: number, arrays: number, objects: number, primitives: number}} JsonStats */
/** @typedef {{key: string, value?: string, type?: string, children?: Array<any>, level?: number}} TreeNode */

// State variables
const router = useRouter();
const getInitialJSON = () => {
  const queryParam = router.currentRoute.value.query.json;
  if (!queryParam) return '{}';
  
  try {
    // Si c'est une chaîne JSON valide directement
    if (typeof queryParam === 'string') {
      // Essayer de décoder l'URL si nécessaire
      const decodedParam = decodeURIComponent(queryParam);
      JSON.parse(decodedParam); // Vérifier si c'est du JSON valide
      return decodedParam;
    }
    
    // Si c'est déjà un objet (Vue Router peut parser automatiquement)
    return JSON.stringify(queryParam, null, 2);
  } catch (error) {
    console.error('Invalid JSON in URL parameter:', error);
    notification.next('error', 'Invalid JSON in URL parameter');
    return '{}';
  }
};

const initialJSON = getInitialJSON();
const activeTab = ref('edit');
const code = ref(initialJSON);
const showRaw = ref(false);
const showJsonCrack = ref(false);
const jsoncrackEmbed = ref();
const convertFormat = ref('yaml');
const convertedOutput = ref('');
const jsonSchema = ref('{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  },\n  "required": ["name", "age"]\n}');
/** @type {import('vue').Ref<ValidationResult | null>} */
const schemaValidationResult = ref(null);
/** @type {import('vue').Ref<JsonStats | null>} */
const jsonStats = ref(null);
const jsonPathQuery = ref('$');
const queryResults = ref(null);
const expandedKeys = ref({});

// PrimeVue specific data
const convertOptions = [
  { name: 'YAML', value: 'yaml' },
  { name: 'XML', value: 'xml' }
];

const speedDialItems = [
  {
    label: 'Load Example',
    icon: 'pi pi-file',
    command: () => openExample()
  },
  {
    label: 'Copy JSON',
    icon: 'pi pi-copy',
    command: () => copy(JSON.stringify(repairedJSON.value, null, 2))
  },
  {
    label: 'Copy Minified JSON',
    icon: 'pi pi-align-justify',
    command: () => copy(JSON.stringify(repairedJSON.value))
  },
  {
    label: 'Tree View',
    icon: 'pi pi-sitemap',
    command: () => openDiagram()
  }
];

// Computed values
const repairedJSON = computed(() => {
  try {
    return JSON.parse(code.value);
  } catch (error) {
    try {
      return JSON.parse(jsonrepair(code.value));
    } catch (error) {
      return {};
    }
  }
});

const stringifiedJSON = computed(() => {
  try {
    return JSON.stringify(repairedJSON.value);
  } catch (error) {
    return '{}';
  }
});

const raw = computed(() => {
  try {
    return JSON.stringify(repairedJSON.value, null, 2).split('\n').join('<br/>');
  } catch (error) {
    return '';
  }
});

const isValid = computed(() => {
  try {
    JSON.parse(code.value);
    return true;
  } catch (error) {
    return false;
  }
});

const queryResultsFormatted = computed(() => {
  return queryResults.value ? JSON.stringify(queryResults.value, null, 2) : '';
});

const jsonStatsForTable = computed(() => {
  if (!jsonStats.value) return [];
  
  return [
    { property: 'Size in bytes', value: jsonStats.value.size },
    { property: 'Stringified length', value: jsonStats.value.stringifiedSize },
    { property: 'Maximum depth', value: jsonStats.value.depth },
    { property: 'Total keys', value: jsonStats.value.keys },
    { property: 'Total arrays', value: jsonStats.value.arrays },
    { property: 'Total objects', value: jsonStats.value.objects },
    { property: 'Total primitives', value: jsonStats.value.primitives }
  ];
});

// Process JSON data - completely separate from Vue reactivity system
/**
 * Convert JSON to a flat array with parent-child relationships for TreeTable
 * @param {any} json - The JSON object to convert
 * @returns {Array<any>} - Array for TreeTable
 */
function flattenJSON(json) {
  const nodes = [];
  let nodeId = 0;
  
  /**
   * Process a node in the JSON 
   * @param {any} value - Value to process
   * @param {string} key - Key name
   * @param {string|null} parentKey - Parent key or null for root
   * @param {number} level - Nesting level
   */
  function processNode(value, key, parentKey = null, level = 0) {
    const currentId = `node_${nodeId++}`;
    
    const node = {
      key: currentId,
      data: {
        key: key,
        value: '',
        type: typeof value
      },
      children: []
    };
    
    // Add to parent if exists
    if (parentKey !== null) {
      const parent = nodes.find(n => n.key === parentKey);
      if (parent && Array.isArray(parent.children)) {
        parent.children.push(node);
      }
    }
    
    // Process based on type
    if (value === null) {
      node.data.value = 'null';
      node.data.type = 'null';
      nodes.push(node);
    } else if (Array.isArray(value)) {
      node.data.value = `Array[${value.length}]`;
      node.data.type = 'array';
      nodes.push(node);
      
      // Process array items
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          processNode(item, `${index}`, currentId, level + 1);
        } else {
          const leafId = `node_${nodeId++}`;
          const leafNode = {
            key: leafId,
            data: {
              key: `${index}`,
              value: JSON.stringify(item),
              type: typeof item
            },
            children: []
          };
          node.children.push(leafNode);
        }
      });
    } else if (typeof value === 'object') {
      node.data.value = 'Object';
      node.data.type = 'object';
      nodes.push(node);
      
      // Process object properties
      Object.entries(value).forEach(([propKey, propValue]) => {
        if (typeof propValue === 'object' && propValue !== null) {
          processNode(propValue, propKey, currentId, level + 1);
        } else {
          const leafId = `node_${nodeId++}`;
          const leafNode = {
            key: leafId,
            data: {
              key: propKey,
              value: JSON.stringify(propValue),
              type: typeof propValue
            },
            children: []
          };
          node.children.push(leafNode);
        }
      });
    } else {
      // Primitive values
      node.data.value = JSON.stringify(value);
      nodes.push(node);
    }
    
    return node;
  }
  
  // Start processing from root
  const rootNode = processNode(json, 'root');
  
  // For PrimeVue TreeTable, only return top-level nodes
  return [rootNode];
}

// TreeTable data - computed once and not affected by expandedKeys
const treeTableData = computed(() => {
  try {
    const jsonObj = repairedJSON.value;
    return flattenJSON(jsonObj);
  } catch (error) {
    console.error('Error creating tree data:', error);
    return [];
  }
});

// Initialize expanded keys just once when component is mounted
onMounted(() => {
  // Only expand root node
  expandedKeys.value = { 'node_0': true };
});

// Methods
/** @param {string} data */
function copy(data) {
  navigator.clipboard.writeText(data)
    .then(() => notification.next('success', 'Data copied to clipboard'));
}

// Open diagram visualization
const openDiagram = async () => {
  showJsonCrack.value = true;
  await nextTick();
  jsoncrackEmbed.value.onload = () => {
    jsoncrackEmbed.value.contentWindow.postMessage({
      json: stringifiedJSON.value,
    }, '*');
  };
};

// get value class function
const getValueClass = (data) => {
  const type = data.type;
  if (type === 'string') return 'text-green-600';
  if (type === 'number') return 'text-blue-600';
  if (type === 'boolean') return 'text-purple-600';
  if (type === 'object' || type === 'array') return 'text-blue-800 font-bold';
  if (type === null || type === 'null') return 'text-gray-600 font-italic';
  return '';
};

// Get severity for type badges
const getTypeSeverity = (type) => {
  if (type === 'string') return 'success';
  if (type === 'number') return 'info';
  if (type === 'boolean') return 'warning';
  if (type === 'object') return 'secondary';
  if (type === 'array') return 'primary';
  if (type === 'null') return 'help';
  return 'secondary';
};

// Repair invalid JSON
const repairJson = () => {
  try {
    const repaired = jsonrepair(code.value);
    code.value = JSON.stringify(JSON.parse(repaired), null, 2);
    notification.next('success', 'JSON repaired successfully');
  } catch (error) {
    if (error instanceof Error) {
      notification.next('error', 'Unable to repair JSON: ' + error.message);
    } else {
      notification.next('error', 'Unable to repair JSON');
    }
  }
};

// Load example JSON
const openExample = () => {
  code.value = JSON.stringify({
    "store": {
      "book": [
        {
          "category": "reference",
          "author": "Nigel Rees",
          "title": "Sayings of the Century",
          "price": 8.95
        },
        {
          "category": "fiction",
          "author": "Evelyn Waugh",
          "title": "Sword of Honour",
          "price": 12.99
        }
      ],
      "bicycle": {
        "color": "red",
        "price": 19.95
      }
    }
  }, null, 2);
};

// Convert JSON to other formats
const convert = async () => {
  try {
    let endpoint = '';
    if (convertFormat.value === 'yaml') {
      endpoint = '/JSONFormatterEnhanced/to-yaml';
    } else if (convertFormat.value === 'xml') {
      endpoint = '/JSONFormatterEnhanced/to-xml';
    }

    const response = await axios.post(endpoint, {
      json: repairedJSON.value
    });

    if (convertFormat.value === 'yaml') {
      convertedOutput.value = response.data.yaml;
    } else if (convertFormat.value === 'xml') {
      convertedOutput.value = response.data.xml;
    }

    notification.next('success', `Converted to ${convertFormat.value.toUpperCase()} successfully`);
  } catch (error) {
    if (error instanceof Error) {
      notification.next('error', `Conversion error: ${error.message}`);
    } else {
      notification.next('error', 'Conversion error');
    }
  }
};

// Validate JSON against schema
const validateSchema = async () => {
  try {
    const jsonToValidate = repairedJSON.value;
    const schema = JSON.parse(jsonSchema.value);

    const response = await axios.post('/JSONFormatterEnhanced/validate', {
      json: jsonToValidate,
      schema
    });

    schemaValidationResult.value = response.data;
    if (response.data.valid) {
      notification.next('success', 'Schema validation passed');
    } else {
      notification.next('error', 'Schema validation failed');
    }
  } catch (error) {
    if (error instanceof Error) {
      notification.next('error', `Validation error: ${error.message}`);
    } else {
      notification.next('error', 'Validation error');
    }
    
    schemaValidationResult.value = { valid: false, errors: [{ instancePath: '', message: error instanceof Error ? error.message : 'Unknown error' }] };
  }
};

// Analyze JSON
const analyzeJson = async () => {
  try {
    const response = await axios.post('/JSONFormatterEnhanced/stats', {
      json: repairedJSON.value
    });

    jsonStats.value = response.data;
    notification.next('success', 'JSON analysis complete');
  } catch (error) {
    if (error instanceof Error) {
      notification.next('error', `Analysis error: ${error.message}`);
    } else {
      notification.next('error', 'Analysis error');
    }
  }
};

/**
 * Simple JSONPath evaluator for client-side fallback
 * @param {any} obj - The object to query
 * @param {string} path - JSONPath expression
 * @returns {any} - The result of the query
 */
function evaluateJsonPath(obj, path) {
  // Handle root element query
  if (path === '$') {
    return obj;
  }
  
  // Handle direct property access ($.property)
  const directProp = path.match(/^\$\.([a-zA-Z0-9_]+)$/);
  if (directProp && directProp[1]) {
    return obj[directProp[1]];
  }
  
  // Handle array element access ($.array[index])
  const arrayAccess = path.match(/^\$\.([a-zA-Z0-9_]+)\[(\d+)\]$/);
  if (arrayAccess && arrayAccess[1] && arrayAccess[2]) {
    const arr = obj[arrayAccess[1]];
    const index = parseInt(arrayAccess[2], 10);
    if (Array.isArray(arr) && index < arr.length) {
      return arr[index];
    }
  }
  
  // Handle nested property access ($.obj.prop)
  const nestedProps = path.match(/^\$\.(.+)$/);
  if (nestedProps && nestedProps[1]) {
    const props = nestedProps[1].split('.');
    let result = obj;
    
    for (const prop of props) {
      // Handle array index in the middle of the path (obj[0].prop)
      const arrayIndex = prop.match(/([a-zA-Z0-9_]+)\[(\d+)\]/);
      if (arrayIndex) {
        const arrName = arrayIndex[1];
        const index = parseInt(arrayIndex[2], 10);
        
        if (!result[arrName] || !Array.isArray(result[arrName])) {
          return null;
        }
        
        result = result[arrName][index];
      } else {
        // Regular property access
        if (result === null || result === undefined || typeof result !== 'object') {
          return null;
        }
        
        result = result[prop];
      }
      
      if (result === undefined) {
        return null;
      }
    }
    
    return result;
  }
  
  // Handle wildcard array access ($.array[*].prop)
  const wildcardArray = path.match(/^\$\.([a-zA-Z0-9_]+)\[\*\]\.?(.*)$/);
  if (wildcardArray && wildcardArray[1]) {
    const arrayName = wildcardArray[1];
    const restPath = wildcardArray[2];
    
    if (!obj[arrayName] || !Array.isArray(obj[arrayName])) {
      return null;
    }
    
    // If it's just the array with wildcard, return the whole array
    if (!restPath) {
      return obj[arrayName];
    }
    
    // Otherwise map each element with the rest of the path
    return obj[arrayName].map(item => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }
      
      return item[restPath];
    }).filter(item => item !== undefined);
  }
  
  return null;
}

// Query JSON using JSONPath
const queryJson = async () => {
  try {
    // Implémentation client du JSONPath
    let query = jsonPathQuery.value;
    const json = repairedJSON.value;
    
    // Correction automatique de la syntaxe JSONPath
    if (query && !query.startsWith('$') && !query.startsWith('$.')) {
      // Si l'utilisateur a entré "prop" au lieu de "$.prop"
      query = '$.' + query;
    }
    
    // Essayer d'évaluer côté client d'abord
    const clientResult = evaluateJsonPath(json, query);
    if (clientResult !== undefined) {
      queryResults.value = clientResult;
      notification.next('success', 'Query executed successfully (client-side)');
      return;
    }
    
    // Pour les requêtes plus complexes, utiliser le backend
    const response = await axios.post('/JSONFormatterEnhanced/query', {
      json: json,
      query: query
    });

    if (response.data && Array.isArray(response.data) && 
        response.data.length === 1 && 
        response.data[0] && 
        response.data[0].message && 
        response.data[0].message.includes('implementation would return')) {
      // Le backend n'a pas implémenté correctement la requête
      notification.next('error', 'Server implementation not complete. Using client-side processing.');
      
      // Message informatif si le client n'a pas pu évaluer non plus
      queryResults.value = null;
      notification.next('error', 'Path not found or invalid JSONPath syntax. Try a simpler path like "$.property" or "$.array[0]"');
    } else {
      queryResults.value = response.data;
      notification.next('success', 'Query executed successfully (server-side)');
    }
  } catch (error) {
    if (error instanceof Error) {
      notification.next('error', `Query error: ${error.message}`);
    } else {
      notification.next('error', 'Query error');
    }
  }
};
</script>

<style scoped>
.json-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.tabs {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    border-bottom: 2px solid var(--primary-color);
    font-weight: bold;
  }
  
  i {
    margin-right: 5px;
  }
}

.section-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  
  .left-panel, .right-panel {
    width: 50%;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    margin: 0 0 10px 0;
  }
}

.editor {
  margin-bottom: 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  flex-grow: 1;
}

.editor-sm {
  margin-bottom: 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

.actions {
  height: 40px;
}
.actions, .conversion-options, .validation-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.validation-actions {
  justify-content: center;
  margin: 15px 0;
}

.conversion-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  .options {
    display: flex;
    align-items: center;
  }
}

.validation-results {
  margin-top: 15px;
}

.validation-errors {
  margin-top: 15px;
}

.view-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  
  .option {
    display: flex;
    align-items: center;
    
    label {
      margin-left: 5px;
    }
  }
}

.json-tree {
  max-height: calc(100vh - 260px);
  overflow: auto;
}

.raw-json {
  max-height: calc(100vh - 260px);
  overflow: auto;
}

/* Leave the PrimeVue component-specific styles intact */
:deep(.p-tree) {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0.5rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
}

:deep(.p-treetable-toggler) {
  background: transparent;
  color: var(--text-color);
}

:deep(.p-tag) {
  padding: 0 10px;
}


:deep(.p-treetable-tbody > tr) {
  background: transparent
}


.json-tree :deep(.p-treetable-toggler) {
  margin-right: 0.5rem;
}
</style>

<style>
@import 'primevue/resources/themes/lara-light-blue/theme.css';
@import 'primevue/resources/primevue.min.css';
@import 'primeicons/primeicons.css';
@import 'primeflex/primeflex.css';
</style> 
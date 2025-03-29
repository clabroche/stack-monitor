<template>
  <div class="jwt-root">
    <h1>JWT Tools</h1>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'decode' }" @click="activeTab = 'decode'">
        <i class="fas fa-search"></i> Decode
      </div>
      <div class="tab" :class="{ active: activeTab === 'verify' }" @click="activeTab = 'verify'">
        <i class="fas fa-check-circle"></i> Verify
      </div>
      <div class="tab" :class="{ active: activeTab === 'generate' }" @click="activeTab = 'generate'">
        <i class="fas fa-plus-circle"></i> Generate
      </div>
      <div class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
        <i class="fas fa-history"></i> History
      </div>
    </div>

    <!-- Decode Tab -->
    <section-cmp v-if="activeTab === 'decode'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JWT Token</h3>
          <editor 
            v-model="token" 
            language="text" 
            style="height: calc(100vh - 300px); min-height: 200px;"
            placeholder="Paste JWT token here..."
          ></editor>
          <div class="actions">
            <button @click="decodeToken"><i class="fas fa-search"></i> Decode</button>
            <button @click="analyzeToken"><i class="fas fa-microscope"></i> Analyze</button>
            <button @click="clearToken"><i class="fas fa-eraser"></i> Clear</button>
          </div>
        </div>
        <div class="right-panel">
          <div class="view-options">
            <div class="option">
              <input type="radio" id="structured" v-model="viewMode" value="structured">
              <label for="structured">Structured</label>
            </div>
            <div class="option">
              <input type="radio" id="raw" v-model="viewMode" value="raw">
              <label for="raw">Raw</label>
            </div>
            <div class="option">
              <input type="radio" id="analysis" v-model="viewMode" value="analysis">
              <label for="analysis">Analysis</label>
            </div>
          </div>

          <div v-if="viewMode === 'structured' && decodedToken" class="token-parts">
            <div class="token-part header" v-if="decodedToken.header">
              <h4>Header</h4>
              <JsonTreeView :json="JSON.stringify(decodedToken.header)" :maxDepth="5" :copyable="true"/>
            </div>
            <div class="token-part payload" v-if="decodedToken.payload">
              <h4>Payload</h4>
              <JsonTreeView :json="JSON.stringify(decodedToken.payload)" :maxDepth="5" :copyable="true"/>
            </div>
            <div class="token-part signature" v-if="decodedToken.signature">
              <h4>Signature</h4>
              <div class="signature-info">
                <code>{{ decodedToken.signature }}</code>
              </div>
            </div>
          </div>

          <div v-else-if="viewMode === 'raw' && decodedToken" class="raw-view">
            <pre>{{ JSON.stringify(decodedToken, null, 2) }}</pre>
          </div>

          <div v-else-if="viewMode === 'analysis' && tokenAnalysis" class="analysis-view">
            <div class="expiration-info" v-if="tokenAnalysis.validation">
              <h4>Validity</h4>
              <div class="validity-status" :class="{ expired: tokenAnalysis.validation.isExpired }">
                <span v-if="tokenAnalysis.validation.hasExpiry">
                  {{ tokenAnalysis.validation.isExpired ? 'EXPIRED' : 'VALID' }}
                  <span v-if="!tokenAnalysis.validation.isExpired"> - Expires in {{ tokenAnalysis.validation.expiresIn }}</span>
                </span>
                <span v-else>No expiration set</span>
              </div>
            </div>

            <div class="security-info" v-if="tokenAnalysis.security">
              <h4>Security</h4>
              <div class="security-status" :class="{ insecure: !tokenAnalysis.security.isSecure }">
                <span>Algorithm: {{ tokenAnalysis.security.algorithm }}</span>
                <span v-if="!tokenAnalysis.security.isSecure" class="warning">
                  <i class="fas fa-exclamation-triangle"></i> Potentially insecure algorithm
                </span>
              </div>
            </div>

            <div class="structure-info" v-if="tokenAnalysis.structure">
              <h4>Structure</h4>
              <div class="structure-details">
                <div class="structure-item">
                  <span class="label">Header</span>
                  <span class="value"><i class="fas fa-check"></i></span>
                </div>
                <div class="structure-item">
                  <span class="label">Payload</span>
                  <span class="value"><i class="fas fa-check"></i></span>
                </div>
                <div class="structure-item">
                  <span class="label">Signature</span>
                  <span class="value">
                    <i v-if="tokenAnalysis.structure.signature" class="fas fa-check"></i>
                    <i v-else class="fas fa-times"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Enter a JWT token and click Decode or Analyze</p>
          </div>
        </div>
      </div>
    </section-cmp>

    <!-- Verify Tab -->
    <section-cmp v-if="activeTab === 'verify'">
      <div class="section-content">
        <div class="left-panel">
          <h3>JWT Token</h3>
          <editor 
            v-model="token" 
            language="text" 
            style="height: 150px;"
            placeholder="Paste JWT token here..."
          ></editor>
          
          <h3>Secret</h3>
          <editor 
            v-model="secret" 
            language="text" 
            style="height: 80px;"
            placeholder="Enter secret key..."
          ></editor>
          
          <h3>Options (JSON)</h3>
          <editor 
            v-model="verifyOptions" 
            language="json" 
            style="height: 100px;"
            placeholder="{ 'algorithms': ['HS256'] }"
          ></editor>
          
          <div class="actions">
            <button @click="verifyToken"><i class="fas fa-check-circle"></i> Verify</button>
            <button @click="clearVerify"><i class="fas fa-eraser"></i> Clear</button>
          </div>
        </div>
        
        <div class="right-panel">
          <h3>Verification Result</h3>
          <div v-if="verificationResult">
            <div v-if="verificationResult.error" class="verification-error">
              <i class="fas fa-times-circle"></i> 
              {{ verificationResult.error }}
            </div>
            <div v-else class="verification-success">
              <i class="fas fa-check-circle"></i> Signature verified
              <JsonTreeView :json="JSON.stringify(verificationResult)" :maxDepth="5" :copyable="true"/>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>Enter token and secret, then click Verify</p>
          </div>
        </div>
      </div>
    </section-cmp>

    <!-- Generate Tab -->
    <section-cmp v-if="activeTab === 'generate'">
      <div class="section-content">
        <div class="left-panel">
          <h3>Payload (JSON)</h3>
          <editor 
            v-model="generatePayload" 
            language="json" 
            style="height: 200px;"
            placeholder="{ 'sub': '1234', 'name': 'John Doe', 'iat': 1516239022 }"
          ></editor>
          
          <h3>Secret</h3>
          <editor 
            v-model="generateSecret" 
            language="text" 
            style="height: 80px;"
            placeholder="Enter secret key..."
          ></editor>
          
          <h3>Options (JSON)</h3>
          <editor 
            v-model="generateOptions" 
            language="json" 
            style="height: 100px;"
            placeholder="{ 'expiresIn': '1h', 'algorithm': 'HS256' }"
          ></editor>
          
          <div class="actions">
            <button @click="generateToken"><i class="fas fa-plus-circle"></i> Generate</button>
            <button @click="clearGenerate"><i class="fas fa-eraser"></i> Clear</button>
          </div>
        </div>
        
        <div class="right-panel">
          <h3>Generated Token</h3>
          <div v-if="generatedToken" class="generated-token">
            <pre>{{ generatedToken }}</pre>
            <div class="token-actions">
              <button @click="copyToClipboard(generatedToken)">
                <i class="fas fa-copy"></i> Copy
              </button>
              <button @click="saveToHistory(generatedToken)">
                <i class="fas fa-save"></i> Save to History
              </button>
              <button @click="switchToDecodeWithToken(generatedToken)">
                <i class="fas fa-search"></i> Decode
              </button>
            </div>
          </div>
          <div v-else-if="generateError" class="generation-error">
            <i class="fas fa-times-circle"></i> 
            {{ generateError }}
          </div>
          <div v-else class="empty-state">
            <p>Fill in the payload and secret, then click Generate</p>
          </div>
        </div>
      </div>
    </section-cmp>

    <!-- History Tab -->
    <section-cmp v-if="activeTab === 'history'">
      <div class="section-content history-content">
        <h3>Token History</h3>
        <div v-if="tokenHistory.length" class="token-history">
          <div v-for="(item, index) in tokenHistory" :key="index" class="history-item">
            <div class="history-token">
              <div class="token-preview">{{ truncateToken(item.token) }}</div>
              <div class="token-meta">
                <span class="token-timestamp">{{ formatDate(item.timestamp) }}</span>
                <span class="token-type">{{ item.type }}</span>
              </div>
            </div>
            <div class="history-actions">
              <button @click="switchToDecodeWithToken(item.token)">
                <i class="fas fa-search"></i>
              </button>
              <button @click="copyToClipboard(item.token)">
                <i class="fas fa-copy"></i>
              </button>
              <button @click="removeFromHistory(index)" class="danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No tokens in history yet</p>
        </div>
        <div class="history-actions-global">
          <button @click="clearHistory" class="danger" :disabled="!tokenHistory.length">
            <i class="fas fa-trash"></i> Clear All History
          </button>
        </div>
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { JsonTreeView } from 'json-tree-view-vue3';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';

// Tabs
const activeTab = ref('decode');

// Decode tab
const token = ref('');
const decodedToken = ref(null);
const tokenAnalysis = ref(null);
const viewMode = ref('structured');

// Verify tab
const secret = ref('');
const verifyOptions = ref('{}');
const verificationResult = ref(null);

// Generate tab
const generatePayload = ref(JSON.stringify({
  sub: '1234567890',
  name: 'John Doe',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
}, null, 2));
const generateSecret = ref('your-256-bit-secret');
const generateOptions = ref(JSON.stringify({
  algorithm: 'HS256',
  expiresIn: '1h'
}, null, 2));
const generatedToken = ref('');
const generateError = ref('');

// History tab
const tokenHistory = ref([]);
const HISTORY_STORAGE_KEY = 'jwt-token-history';

// Load history from localStorage
onMounted(() => {
  const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (savedHistory) {
    try {
      tokenHistory.value = JSON.parse(savedHistory);
    } catch (error) {
      tokenHistory.value = [];
    }
  }
});

// Save history to localStorage
const saveHistory = () => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(tokenHistory.value));
};

// Decode functions
const decodeToken = async () => {
  if (!token.value) return;

  try {
    const { data } = await axios.post('/JWT', { jwt: token.value });
    decodedToken.value = data;
    viewMode.value = 'structured';
    
    // Add to history
    saveToHistory(token.value, 'decoded');
  } catch (error) {
    console.error('Error decoding token:', error);
    decodedToken.value = { error: 'Invalid token format' };
  }
};

const analyzeToken = async () => {
  if (!token.value) return;

  try {
    const { data } = await axios.post('/JWT/analyze', { jwt: token.value });
    tokenAnalysis.value = data;
    viewMode.value = 'analysis';
    
    // Add to history
    saveToHistory(token.value, 'analyzed');
  } catch (error) {
    console.error('Error analyzing token:', error);
    tokenAnalysis.value = { error: 'Invalid token format' };
  }
};

const clearToken = () => {
  token.value = '';
  decodedToken.value = null;
  tokenAnalysis.value = null;
};

// Verify functions
const verifyToken = async () => {
  if (!token.value || !secret.value) return;

  try {
    let options = {};
    try {
      options = JSON.parse(verifyOptions.value);
    } catch (e) {
      options = {};
    }

    const { data } = await axios.post('/JWT/verify', { 
      jwt: token.value,
      secret: secret.value,
      options
    });
    verificationResult.value = data;
    
    // Add to history if verified successfully
    if (!data.error) {
      saveToHistory(token.value, 'verified');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    verificationResult.value = { error: 'Invalid request' };
  }
};

const clearVerify = () => {
  token.value = '';
  secret.value = '';
  verifyOptions.value = '{}';
  verificationResult.value = null;
};

// Generate functions
const generateToken = async () => {
  try {
    let payload = {};
    try {
      payload = JSON.parse(generatePayload.value);
    } catch (e) {
      generateError.value = 'Invalid JSON payload';
      return;
    }

    let options = {};
    try {
      options = JSON.parse(generateOptions.value);
    } catch (e) {
      options = {};
    }

    if (!generateSecret.value) {
      generateError.value = 'Secret is required';
      return;
    }

    const { data } = await axios.post('/JWT/generate', { 
      payload,
      secret: generateSecret.value,
      options
    });
    
    if (data.token) {
      generatedToken.value = data.token;
      generateError.value = '';
      saveToHistory(data.token, 'generated');
    } else if (data.error) {
      generateError.value = data.error;
      generatedToken.value = '';
    }
  } catch (error) {
    console.error('Error generating token:', error);
    generateError.value = 'Failed to generate token';
    generatedToken.value = '';
  }
};

const clearGenerate = () => {
  generatePayload.value = JSON.stringify({
    sub: '1234567890',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }, null, 2);
  generateOptions.value = JSON.stringify({
    algorithm: 'HS256',
    expiresIn: '1h'
  }, null, 2);
  generatedToken.value = '';
  generateError.value = '';
};

// History functions
const saveToHistory = (tokenValue, type = 'decoded') => {
  // Check if already in history
  const exists = tokenHistory.value.findIndex(item => item.token === tokenValue) !== -1;
  if (!exists) {
    tokenHistory.value.unshift({
      token: tokenValue,
      timestamp: Date.now(),
      type
    });
    
    // Limit history size
    if (tokenHistory.value.length > 20) {
      tokenHistory.value = tokenHistory.value.slice(0, 20);
    }
    
    saveHistory();
  }
};

const removeFromHistory = (index) => {
  tokenHistory.value.splice(index, 1);
  saveHistory();
};

const clearHistory = () => {
  tokenHistory.value = [];
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

const truncateToken = (tokenValue) => {
  if (tokenValue.length > 40) {
    return tokenValue.substring(0, 20) + '...' + tokenValue.substring(tokenValue.length - 20);
  }
  return tokenValue;
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const switchToDecodeWithToken = (tokenValue) => {
  token.value = tokenValue;
  activeTab.value = 'decode';
  decodeToken();
};

// Clipboard functions
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Success notification would go here
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
    });
};
</script>

<style scoped lang="scss">
.jwt-root {
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
    border-bottom: 2px solid #4287f5;
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

.history-content {
  flex-direction: column;
}

.actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  
  button {
    padding: 8px 15px;
    background-color: #4287f5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #2a6fd9;
    }
    
    i {
      margin-right: 5px;
    }
  }
}

.view-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  
  .option {
    display: flex;
    align-items: center;
    
    input {
      margin-right: 5px;
    }
  }
}

.token-parts {
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  .token-part {
    padding: 15px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.02);
    
    h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
    }
    
    &.header {
      border-left: 3px solid #e63946;
    }
    
    &.payload {
      border-left: 3px solid #2a9d8f;
    }
    
    &.signature {
      border-left: 3px solid #4287f5;
    }
  }
}

.raw-view, .analysis-view {
  padding: 15px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 5px;
  
  h4 {
    margin-top: 0;
    margin-bottom: 10px;
  }
}

.generated-token {
  background-color: rgba(0, 0, 0, 0.02);
  padding: 15px;
  border-radius: 5px;
  word-break: break-all;
  
  pre {
    margin: 0 0 15px 0;
    white-space: pre-wrap;
  }
  
  .token-actions {
    display: flex;
    gap: 10px;
    
    button {
      padding: 6px 12px;
      background-color: #4287f5;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background-color: #2a6fd9;
      }
    }
  }
}

.verification-success {
  color: #2a9d8f;
  margin-bottom: 15px;
  
  i {
    margin-right: 5px;
  }
}

.verification-error, .generation-error {
  color: #e63946;
  margin-bottom: 15px;
  
  i {
    margin-right: 5px;
  }
}

.validity-status {
  padding: 10px;
  border-radius: 5px;
  background-color: rgba(42, 157, 143, 0.1);
  margin-bottom: 15px;
  
  &.expired {
    background-color: rgba(230, 57, 70, 0.1);
    color: #e63946;
  }
}

.security-status {
  padding: 10px;
  border-radius: 5px;
  background-color: rgba(42, 157, 143, 0.1);
  margin-bottom: 15px;
  
  &.insecure {
    background-color: rgba(230, 57, 70, 0.1);
    
    .warning {
      color: #e63946;
      display: block;
      margin-top: 5px;
    }
  }
}

.structure-info {
  margin-bottom: 15px;
  
  .structure-details {
    padding: 10px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .structure-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    
    .label {
      font-weight: bold;
    }
    
    .value {
      .fa-check {
        color: #2a9d8f;
      }
      
      .fa-times {
        color: #e63946;
      }
    }
  }
}

.token-history {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .history-item {
    display: flex;
    justify-content: space-between;
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 5px;
    align-items: center;
    
    .history-token {
      .token-preview {
        font-family: monospace;
        word-break: break-all;
      }
      
      .token-meta {
        margin-top: 5px;
        font-size: 12px;
        color: #777;
        
        .token-timestamp {
          margin-right: 10px;
        }
        
        .token-type {
          text-transform: capitalize;
        }
      }
    }
    
    .history-actions {
      display: flex;
      gap: 5px;
      
      button {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        border: none;
        background-color: #4287f5;
        color: white;
        cursor: pointer;
        
        &:hover {
          background-color: #2a6fd9;
        }
        
        &.danger {
          background-color: #e63946;
          
          &:hover {
            background-color: #c1121f;
          }
        }
      }
    }
  }
}

.history-actions-global {
  margin-top: 20px;
  
  button {
    padding: 8px 15px;
    border-radius: 4px;
    border: none;
    background-color: #e63946;
    color: white;
    cursor: pointer;
    
    &:hover {
      background-color: #c1121f;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 5px;
  color: #777;
}
</style>

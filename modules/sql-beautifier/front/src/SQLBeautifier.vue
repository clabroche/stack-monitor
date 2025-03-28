<template>
  <div class="sql-beautifier">
    <header class="header">
      <h1>SQL Beautifier</h1>
      <p class="description">Format and beautify your SQL queries</p>
    </header>
    <div class="editors-container">
      <div class="editor-section">
        <h3>Input SQL</h3>
        <Editor 
          v-model="inputSQL" 
          language="sql" 
          :additionalOptions="{ 
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14
          }" 
        />
      </div>
      <div class="editor-section">
        <h3>Beautified SQL</h3>
        <Editor 
          v-model="beautifiedSQL" 
          language="sql" 
          :readonly="true"
          :additionalOptions="{ 
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14
          }" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import axios, { AxiosError } from 'axios';
import debounce from 'debounce';
import Editor from '../../../../fronts/app/src/components/Editor.vue';

// State
const inputSQL = ref('');
const beautifiedSQL = ref('');
const isLoading = ref(false);

// Constants
const DEBOUNCE_DELAY = 500;
const API_ENDPOINT = '/sqlbeautifier/beautify';

// Types
interface BeautifyResponse {
  result: string;
}

interface ErrorResponse {
  error: string;
}

// Helper functions
const formatError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return axiosError.response?.data?.error || axiosError.message;
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
};

const beautifySQL = debounce(async (sql: string) => {
  if (!sql.trim()) {
    beautifiedSQL.value = '';
    return;
  }

  isLoading.value = true;
  try {
    const response = await axios.post<BeautifyResponse>(API_ENDPOINT, { sql });
    beautifiedSQL.value = response.data.result;
  } catch (error) {
    beautifiedSQL.value = `Error: ${formatError(error)}`;
  } finally {
    isLoading.value = false;
  }
}, DEBOUNCE_DELAY);

// Watchers
watch(inputSQL, beautifySQL);

// Initial beautification
beautifySQL(inputSQL.value);
</script>

<style scoped>
.sql-beautifier {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
}

.header {
  margin-bottom: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.header .description {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.editors-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  width: 100%;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.editor-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-color);
}

.editor-section :deep(.monaco-editor) {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.explanation {
  margin-top: 10px;
  padding: 10px;
  background-color: var(--background-color-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  max-height: 150px;
  overflow-y: auto;
}

.explanation h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 14px;
}

.explanation-content {
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-color-secondary);
}

.explanation-line {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.line-number {
  color: var(--text-color-tertiary);
  min-width: 24px;
}

.line-text {
  flex: 1;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: auto;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: var(--primary-color-hover);
}

button:disabled {
  background-color: var(--disabled-color);
  cursor: not-allowed;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style> 
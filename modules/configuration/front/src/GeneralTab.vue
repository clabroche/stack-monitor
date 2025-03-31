<template>
  <div class="configuration-container">
    <div class="config-grid">
      <!-- Description section -->
      <div class="section">
        <div class="section-header">
          <i class="fas fa-info-circle mr-2"></i>
          <span>Description</span>
          <i v-tooltip="'Description of your service that will be displayed in the interface'" class="fas fa-question-circle ml-2 hint-icon"></i>
        </div>
        <div class="section-content">
          <EditableField
            v-model="service.description"
            placeholder="Enter a description for your service..."
            @save="service.save()"
          />
        </div>
      </div>

      <!-- Root path section -->
      <div class="section">
        <div class="section-header">
          <i class="fas fa-folder mr-2"></i>
          <span>Root path</span>
          <i v-tooltip="'The path on which all commands will be executed. This is the base path of commands. If stack monitor was launched with environments variables, you can reference them in the path. Example: $EXTERNAL_PATH_TO_SERVICES/platform'" class="fas fa-question-circle ml-2 hint-icon"></i>
        </div>
        <div class="section-content">
          <EditableField
            v-model="service.rootPath"
            placeholder="Enter the root path of your service..."
            @save="service.save()"
          />
        </div>
      </div>

      <!-- URL section -->
      <div class="section">
        <div class="section-header">
          <i class="fas fa-globe mr-2"></i>
          <span>URL</span>
          <i v-tooltip="'The URL where your service is accessible'" class="fas fa-question-circle ml-2 hint-icon"></i>
        </div>
        <div class="section-content">
          <EditableField
            v-model="service.url"
            placeholder="Enter the URL of your service..."
            @save="service.save()"
          />
        </div>
      </div>

      <!-- OpenAPI section -->
      <div class="section">
        <div class="section-header">
          <div v-html="openApiSvgIcon" class="svg-icon mr-2"></div>
          <span>Openapi URL</span>
          <i v-tooltip="'URL to your OpenAPI/Swagger documentation'" class="fas fa-question-circle ml-2 hint-icon"></i>
        </div>
        <div class="section-content">
          <EditableField
            v-model="service.openapiURL"
            placeholder="Enter the OpenAPI documentation URL..."
            @save="service.save()"
          />
        </div>
      </div>
    </div>

    <!-- Git section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-code-branch mr-2"></i>
        <span>Git</span>
        <i v-tooltip="'Git configuration for your service'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="git-config">
          <div class="git-field">
            <div class="git-label">Home</div>
            <EditableField
              v-model="service.git.home"
              placeholder="Enter git home path..."
              @save="service.save()"
            />
          </div>
          <div class="git-field">
            <div class="git-label">Remote</div>
            <EditableField
              v-model="service.git.remote"
              placeholder="Enter git remote URL..."
              @save="service.save()"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Groups section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-layer-group mr-2"></i>
        <span>Groups</span>
        <i v-tooltip="'Groups help you organize your services'" class="fas fa-question-circle ml-2 hint-icon"></i>
        <Button label="Add" icon="fas fa-plus" @click="addGroup" class="ml-auto compact-btn" />
      </div>
      <div class="section-content">
        <div class="groups-container">
          <div v-for="(group, i) in service.groups || []" :key="`group-${i}`" class="parser-card">
            <div class="parser-card-content">
              <i class="fas fa-layer-group parser-icon"></i>
              <EditableField
                v-model="service.groups[i]"
                placeholder="Enter group name..."
                @save="service.save()"
                class="flex-1"
              />
            </div>
            <div class="parser-card-actions">
              <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeGroup(i)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Parsers section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-scroll mr-2"></i>
        <span>Parsers</span>
        <i v-tooltip="'Modify the lines produced by your commands to display them the way you want. You can go to the settings to add more.'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="parsers-section">
          <TransitionGroup name="parser-list" tag="div" class="parsers-grid">
            <div v-for="(parserId, i) in service.parsers || []" :key="`parser-${parserId}`" class="parser-card">
              <div class="parser-card-content">
                <i class="fas fa-scroll parser-icon"></i>
                <span class="parser-name">{{ getParserLabel(parserId) }}</span>
              </div>
              <div class="parser-card-actions">
                <div class="reorder-actions">
                  <Button v-if="i > 0" icon="fas fa-arrow-up" @click="moveParser(i, i-1)" text size="small" class="reorder-btn" />
                  <Button v-else icon="fas fa-arrow-up" disabled text size="small" class="reorder-btn" />
                  <Button v-if="i < (service.parsers?.length || 0) - 1" icon="fas fa-arrow-down" @click="moveParser(i, i+1)" text size="small" class="reorder-btn" />
                  <Button v-else icon="fas fa-arrow-down" disabled text size="small" class="reorder-btn" />
                </div>
                <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeParser(i)" />
              </div>
            </div>
          </TransitionGroup>
          
          <div class="dropdown-container mt-2">
            <div class="parser-add-row">
              <Dropdown 
                v-model="selectedParser" 
                :options="availableParsers" 
                optionLabel="label" 
                optionValue="id"
                placeholder="Select a parser to add..."
                class="parser-dropdown"
                :disabled="!availableParsers.length"
                @change="addParser"
              />
            </div>
            <small v-if="!availableParsers.length" class="no-parsers-note">All available parsers are already added</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Metadata section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-list mr-2"></i>
        <span>Metadata</span>
        <i v-tooltip="'Custom key-value pairs to add additional information to your service'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="meta-grid">
          <div v-for="metaKey in Object.keys(service.meta || {})" :key="`meta-${metaKey}`" class="parser-card">
            <div class="parser-card-content">
              <i class="fas fa-tag parser-icon"></i>
              <div class="meta-content w-full">
                <div class="meta-key">{{ metaKey }}</div>
                <EditableField
                  v-model="service.meta[metaKey]"
                  placeholder="Enter metadata value..."
                  @save="service.save()"
                />
              </div>
            </div>
            <div class="parser-card-actions">
              <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeMetadata(metaKey)" />
            </div>
          </div>
        </div>
        <div class="add-metadata mt-2">
          <InputText 
            v-model="newMetaKey" 
            placeholder="Enter metadata key..." 
            class="mr-2" 
          />
          <Button label="Add" icon="fas fa-plus" @click="addMetadata" class="compact-btn" :disabled="!newMetaKey" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import EditableField from './EditableField.vue';
import Parsers from '../../../../fronts/app/src/models/Parsers';
import { TransitionGroup } from 'vue';

/**
 * @typedef {Object} Parser
 * @property {string} id - ID unique du parser
 * @property {string} label - Libellé du parser
 */

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  expandedKeys: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:expandedKeys']);
/** @type {import('vue').Ref<Parser[]>} */
const parsers = ref([]);
const selectedParser = ref(null);
const newMetaKey = ref('');

const inplaceRefs = ref({
  description: null,
  rootPath: null,
  url: null,
  openapi: null
});

onMounted(async () => {
  parsers.value = await Parsers.all();
});

const openApiSvgIcon = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: 15px;"><title>Swagger</title><path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12c6.616 0 12-5.383 12-12S18.616 0 12 0zm0 1.144c5.995 0 10.856 4.86 10.856 10.856 0 5.995-4.86 10.856-10.856 10.856-5.996 0-10.856-4.86-10.856-10.856C1.144 6.004 6.004 1.144 12 1.144zM8.37 5.868a6.707 6.707 0 0 0-.423.005c-.983.056-1.573.517-1.735 1.472-.115.665-.096 1.348-.143 2.017-.013.35-.05.697-.115 1.038-.134.609-.397.798-1.016.83a2.65 2.65 0 0 0-.244.042v1.463c1.126.055 1.278.452 1.37 1.629.033.429-.013.858.015 1.287.018.406.073.808.156 1.2.259 1.075 1.307 1.435 2.575 1.218v-1.283c-.203 0-.383.005-.558 0-.43-.013-.591-.12-.632-.535-.056-.535-.042-1.08-.075-1.62-.064-1.001-.175-1.988-1.153-2.625.503-.37.868-.812.983-1.398.083-.41.134-.821.166-1.237.028-.415-.023-.84.014-1.25.06-.665.102-.937.9-.91.12 0 .235-.017.369-.027v-1.31c-.16 0-.31-.004-.454-.006zm7.593.009a4.247 4.247 0 0 0-.813.06v1.274c.245 0 .434 0 .623.005.328.004.577.13.61.494.032.332.031.669.064 1.006.065.669.101 1.347.217 2.007.102.544.475.95.941 1.283-.817.549-1.057 1.333-1.098 2.215-.023.604-.037 1.213-.069 1.822-.028.554-.222.734-.78.748-.157.004-.31.018-.484.028v1.305c.327 0 .627.019.927 0 .932-.055 1.495-.507 1.68-1.412.078-.498.124-1 .138-1.504.032-.461.028-.927.074-1.384.069-.715.397-1.01 1.112-1.057a.972.972 0 0 0 .199-.046v-1.463c-.12-.014-.204-.027-.291-.032-.536-.023-.804-.203-.937-.71a5.146 5.146 0 0 1-.152-.993c-.037-.618-.033-1.241-.074-1.86-.08-1.192-.794-1.753-1.887-1.786zm-6.89 5.28a.844.844 0 0 0-.083 1.684h.055a.83.83 0 0 0 .877-.78v-.046a.845.845 0 0 0-.83-.858zm2.911 0a.808.808 0 0 0-.834.78c0 .027 0 .05.004.078 0 .503.342.826.859.826.507 0 .826-.332.826-.853-.005-.503-.342-.836-.855-.831zm2.963 0a.861.861 0 0 0-.876.835c0 .47.378.849.849.849h.009c.425.074.853-.337.881-.83.023-.457-.392-.854-.863-.854z"/></svg>`;

const availableParsers = computed(() => {
  return parsers.value.filter((parser) => !(props.service.parsers || []).includes(parser.id));
});

function getParserLabel(parserId) {
  const parser = parsers.value.find(p => p.id === parserId);
  return parser?.label || parserId;
}

function addGroup() {
  if (!props.service.groups) props.service.groups = [];
  props.service.groups.push('');
  props.service.save();
}

function removeGroup(index) {
  props.service.groups?.splice(index, 1);
  props.service.save();
}

function addParser() {
  if (!selectedParser.value) return;
  if (!props.service.parsers) props.service.parsers = [];
  props.service.parsers.push(selectedParser.value);
  props.service.save();
  selectedParser.value = null;
}

function removeParser(index) {
  props.service.parsers?.splice(index, 1);
  props.service.save();
}

function moveParser(fromIndex, toIndex) {
  if (!props.service.parsers) return;
  const [parser] = props.service.parsers.splice(fromIndex, 1);
  props.service.parsers.splice(toIndex, 0, parser);
  props.service.save();
}

function addMetadata() {
  if (!newMetaKey.value) return;
  if (!props.service.meta) props.service.meta = {};
  props.service.meta[newMetaKey.value] = '';
  props.service.save();
  newMetaKey.value = '';
}

function removeMetadata(key) {
  if (props.service.meta) {
    delete props.service.meta[key];
    props.service.save();
  }
}

function closeInplace(key) {
  if (inplaceRefs.value[key]) {
    inplaceRefs.value[key].close();
    props.service.save();
  }
}
</script>

<style lang="scss" scoped>
.configuration-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.75rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.section {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--system-sections-backgroundColor);
  border-radius: 6px;
  border: 1px solid var(--system-border-borderColor);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
}

.section-content {
  margin-top: 0.25rem;
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

.svg-icon {
  display: inline-flex;
  align-items: center;
  width: 15px;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.ml-auto {
  margin-left: auto;
}

.mt-2 {
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

.compact-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parsers-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parsers-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.5rem;
}

.parser-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: var(--system-secondary-backgroundColor);
  border-radius: 4px;
  border: 1px solid var(--system-border-borderColor);
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background-color: var(--system-tertiary-backgroundColor);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .parser-card-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    
    .parser-icon {
      color: var(--primary-color);
      font-size: 0.85rem;
    }
    
    .parser-name {
      font-weight: 500;
      font-size: 0.9rem;
    }
  }
  
  .parser-card-actions {
    display: flex;
    gap: 0.25rem;
    
    .reorder-actions {
      display: flex;
      
      .reorder-btn {
        opacity: 0.6;
        
        &:hover:not(:disabled) {
          opacity: 1;
        }
      }
    }
    
    .remove-btn {
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(220, 53, 69, 0.1);
      }
    }
  }
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .no-parsers-note {
    color: var(--system-text-tertiaryLabel);
    font-style: italic;
    font-size: 0.8rem;
  }
}

.parser-add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.parser-dropdown {
  width: 100%;
  flex: 1;
}

.meta-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meta-key {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--system-text-secondaryLabel);
}

.add-metadata {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  :deep(.p-inputtext) {
    flex: 1;
  }
}

.placeholder-text {
  color: var(--system-text-tertiaryLabel);
  font-style: italic;
}

.git-config {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.git-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.git-label {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--system-text-secondaryLabel);
}

:deep(.p-inplace) {
  width: 100%;
  
  .p-inplace-display {
    width: 100%;
    padding: 0.35rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--system-tertiary-backgroundColor);
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

.inplace-display-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  
  .edit-icon {
    font-size: 0.8rem;
    color: var(--system-text-tertiaryLabel);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

.parser-list-move,
.parser-list-enter-active,
.parser-list-leave-active {
  transition: all 0.3s ease;
}

.parser-list-enter-from,
.parser-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.parser-list-leave-active {
  position: absolute;
}
</style> 
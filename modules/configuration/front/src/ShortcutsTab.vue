<template>
  <div class="shortcuts-container">
    <div class="shortcuts-header">
      <h3>Shortcuts</h3>
      <Button 
        class="add-shortcut-btn"
        icon="fas fa-plus" 
        label="Add Shortcut" 
        @click="addNewShortcut"
      />
    </div>

    <div v-if="!service.shortcuts?.length" class="empty-state">
      <i class="fas fa-bolt empty-icon"></i>
      <p>No shortcuts yet. Add your first shortcut to get started.</p>
    </div>

    <div v-else class="shortcuts-list">
      <TransitionGroup name="shortcut-reorder" tag="div" class="shortcuts-transition-container">
        <div 
          v-for="(shortcut, shortcutIndex) in service.shortcuts" 
          :key="`shortcut-${shortcutIndex}`" 
          class="shortcut-card"
        >
          <div 
            class="shortcut-header" 
            @click="toggleShortcutExpanded(shortcutIndex)"
            :class="{'is-expanded': expandedShortcuts.includes(shortcutIndex)}"
          >
            <div class="shortcut-title">
              <i class="fas fa-bolt"></i>
              <h4>{{ shortcut.label || `${shortcut.spawnCmd} ${shortcut.spawnArgs?.join(' ')}` || 'New Shortcut' }}</h4>
            </div>
            <div class="shortcut-actions" @click.stop>
              <Button 
                v-for="action in reorder(service.shortcuts, shortcutIndex)"
                :key="action.icon"
                :icon="action.icon" 
                :disabled="action.disabled"
                @click="action.action"
                class="reorder-btn"
                text
                size="small"
              />
              <Button 
                icon="fas fa-trash" 
                severity="danger" 
                text
                size="small"
                @click="service.shortcuts?.splice(shortcutIndex, 1); save()"
              />
            </div>
          </div>

          <div v-if="expandedShortcuts.includes(shortcutIndex)" class="shortcut-content">
            <TabView class="shortcut-tabs">
              <TabPanel header="Command">
                <div class="shortcut-section">
                  <label class="section-label">Label</label>
                  <div class="p-inputgroup">
                    <InputText 
                      v-model="shortcut.label"
                      placeholder="Enter label..."
                      @change="save"
                      class="p-inputtext-sm"
                    />
                  </div>
                </div>
                
                <div class="section-divider"></div>
                
                <div class="shortcut-section">
                  <label class="section-label">Command</label>
                  <div class="p-inputgroup">
                    <InputText 
                      v-model="shortcut.spawnCmd"
                      placeholder="Enter command..."
                      @change="save"
                      class="p-inputtext-sm"
                    />
                  </div>
                </div>

                <div class="section-divider"></div>
                
                <div class="shortcut-section">
                  <div class="section-header">
                    <label class="section-label">Arguments</label>
                    <Button 
                      icon="fas fa-plus" 
                      text 
                      size="small" 
                      @click="addArgument(shortcut)"
                    />
                  </div>
                  <div v-if="shortcut.spawnArgs?.length" class="arguments-list">
                    <TransitionGroup name="argument-swap" tag="div" class="arguments-transition-container">
                      <div 
                        v-for="(argument, i) in shortcut.spawnArgs" 
                        :key="`arg-${shortcut.id}-${i}`" 
                        class="argument-item"
                      >
                        <div class="p-inputgroup flex-1">
                          <InputText 
                            v-model="shortcut.spawnArgs[i]"
                            placeholder="Enter argument..."
                            @change="save"
                            class="p-inputtext-sm flex-1"
                          />
                        </div>
                        <div class="argument-actions">
                          <Button 
                            v-for="action in reorder(shortcut.spawnArgs, i)"
                            :key="action.icon"
                            :icon="action.icon" 
                            :disabled="action.disabled"
                            @click="action.action"
                            text
                            size="small"
                          />
                          <Button 
                            icon="fas fa-trash" 
                            severity="danger" 
                            text 
                            size="small"
                            @click="shortcut.spawnArgs?.splice(i, 1); save()"
                          />
                        </div>
                      </div>
                    </TransitionGroup>
                  </div>
                  <div v-else class="empty-arguments">
                    <p>No arguments. Click the + button to add one.</p>
                  </div>
                </div>
              </TabPanel>
              
              <TabPanel header="Path">
                <div class="shortcut-section">
                  <label>Working Directory</label>
                  <div class="path-input">
                    <span class="path-prefix">{{ service.rootPath || '.' }}</span>
                    <InputText 
                      v-model="shortcut.spawnOptions.cwd"
                      placeholder="Enter path..."
                      @change="save"
                      class="p-inputtext-sm"
                    />
                  </div>
                  <div class="hint-text">
                    <i class="fas fa-info-circle"></i>
                    <span>It's the concatenation of the rootpath and this one. If stack monitor was launched with environments variables, you can reference them in the path.</span>
                  </div>
                </div>
              </TabPanel>
              
              <TabPanel header="Parsers">
                <div class="shortcut-section parsers-section">
                  <div class="section-header with-hint">
                    <div>
                      <label class="section-label">Parsers</label>
                      <div class="hint-text">
                        <i class="fas fa-info-circle"></i>
                        <span>Parsers transform command output to display it in a more readable way.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="shortcut.parsers?.length" class="parsers-list">
                    <TransitionGroup name="parser-swap" tag="div" class="parsers-transition-container">
                      <div 
                        v-for="(parserId, i) in shortcut.parsers" 
                        :key="`parser-${shortcut.id}-${parserId}`" 
                        class="parser-card"
                      >
                        <div class="parser-card-content">
                          <i class="fas fa-scroll parser-icon"></i>
                          <span class="parser-name">{{ getParserLabel(parserId) }}</span>
                        </div>
                        <div class="parser-card-actions">
                          <div class="reorder-actions">
                            <Button v-if="i > 0" icon="fas fa-arrow-up" @click="moveParserInShortcut(shortcut, i, i-1)" text size="small" class="reorder-btn" />
                            <Button v-else icon="fas fa-arrow-up" disabled text size="small" class="reorder-btn" />
                            <Button v-if="i < (shortcut.parsers?.length || 0) - 1" icon="fas fa-arrow-down" @click="moveParserInShortcut(shortcut, i, i+1)" text size="small" class="reorder-btn" />
                            <Button v-else icon="fas fa-arrow-down" disabled text size="small" class="reorder-btn" />
                          </div>
                          <Button 
                            icon="fas fa-times" 
                            severity="danger" 
                            text 
                            size="small"
                            class="remove-btn"
                            @click="removeParserFromShortcut(shortcut, i)"
                          />
                        </div>
                      </div>
                    </TransitionGroup>
                  </div>
                  <div v-else class="empty-parsers">
                    <p>No parsers selected yet.</p>
                  </div>

                  <div class="dropdown-container mt-2">
                    <div class="parser-add-row">
                      <Dropdown
                        v-if="getFilteredParsers(shortcut).length > 0"
                        :options="getFilteredParsers(shortcut)"
                        optionLabel="label"
                        optionValue="id"
                        placeholder="Select a parser to add..."
                        class="parser-dropdown"
                        :disabled="!getFilteredParsers(shortcut).length"
                        @change="(e) => addParserToShortcut(e.value, shortcut)"
                      />
                    </div>
                    <small v-if="!getFilteredParsers(shortcut).length" class="no-parsers-note">All available parsers are already added</small>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { v4 as uuid } from 'uuid';
import stack from '../../../../fronts/app/src/models/stack';
import Parsers from '../../../../fronts/app/src/models/Parsers';

const props = defineProps({
  service: {
    required: true,
    /** @type {import('../../../../fronts/app/src/models/service').default} */
    default: () => ({}),
  },
  expandedKeys: Object
});

const emit = defineEmits(['update:expandedKeys']);
const parsers = ref([]);
const expandedShortcuts = ref([]);

onMounted(async () => {
  try {
    const parsersList = await Parsers.all();
    parsers.value = parsersList || [];
  } catch (error) {
    console.error('Failed to load parsers:', error);
    parsers.value = [];
  }
});

const save = async () => {
  if (!props.service) return;
  await props.service.save();
  stack.loadServices();
};

// Fonction utilitaire pour réorganiser les éléments dans un tableau
const reorder = (array, index) => {
  if (!array || array.length <= 1) return [];
  const actions = [];
  if (index > 0) {
    actions.push({
      icon: 'fas fa-arrow-up',
      action: () => {
        const item = array[index];
        array[index] = array[index - 1];
        array[index - 1] = item;
        save();
        // Close all shortcuts when reordering
        if (array === props.service.shortcuts) {
          expandedShortcuts.value = [];
        }
      },
    });
  } else actions.push({ icon: 'fas fa-arrow-up', disabled: true });
  if (index < array.length - 1) {
    actions.push({
      icon: 'fas fa-arrow-down',
      action: () => {
        const item = array[index];
        array[index] = array[index + 1];
        array[index + 1] = item;
        save();
        // Close all shortcuts when reordering
        if (array === props.service.shortcuts) {
          expandedShortcuts.value = [];
        }
      },
    });
  } else actions.push({ icon: 'fas fa-arrow-down', disabled: true });
  return actions;
};

const toggleShortcutExpanded = (index) => {
  if (expandedShortcuts.value.includes(index)) {
    expandedShortcuts.value = expandedShortcuts.value.filter((i) => i !== index);
  } else {
    expandedShortcuts.value.push(index);
  }
};

const addNewShortcut = async () => {
  if (!props.service.shortcuts) props.service.shortcuts = [];
  props.service.shortcuts.push({
    id: uuid(), 
    spawnOptions: { cwd: '' }, 
    spawnArgs: [], 
    spawnCmd: '',
    label: '',
  });
  await save();
};

const addArgument = (shortcut) => {
  if (!shortcut.spawnArgs) shortcut.spawnArgs = [];
  shortcut.spawnArgs.push('');
  save();
};

const getParserLabel = (parserId) => {
  if (!parsers.value || !parsers.value.length) return 'Unknown parser';
  const parser = parsers.value.find(p => p && p.id === parserId);
  return parser?.label || 'Unknown parser';
};

const getFilteredParsers = (shortcut) => {
  if (!parsers.value) return [];
  return parsers.value.filter(p => p && !(shortcut.parsers || []).includes(p.id));
};

const addParserToShortcut = (parserId, shortcut) => {
  if (!parserId) return;
  
  if (!shortcut.parsers) {
    shortcut.parsers = [];
  }
  
  if (!shortcut.parsers.includes(parserId)) {
    shortcut.parsers.push(parserId);
    save();
  }
};

const removeParserFromShortcut = (shortcut, index) => {
  if (shortcut.parsers && index >= 0 && index < shortcut.parsers.length) {
    shortcut.parsers.splice(index, 1);
    save();
  }
};

const moveParserInShortcut = (shortcut, fromIndex, toIndex) => {
  if (!shortcut.parsers) return;
  const [parser] = shortcut.parsers.splice(fromIndex, 1);
  shortcut.parsers.splice(toIndex, 0, parser);
  save();
};
</script>

<style lang="scss" scoped>
.shortcuts-container {
  padding: 0;
  width: 100%;
  max-width: 100%;
  overflow-y: auto;
}

.shortcuts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--system-border-borderColor);
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background-color: var(--system-sections-backgroundColor);
  border-radius: 8px;
  text-align: center;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--system-text-tertiaryLabel);
  }
  
  p {
    color: var(--system-text-secondaryLabel);
    font-size: 1rem;
    max-width: 300px;
  }
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
}

.shortcuts-transition-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.shortcut-card {
  background-color: var(--system-sections-backgroundColor);
  border-radius: 8px;
  border: 1px solid var(--system-border-borderColor);
  overflow: hidden;
  transition: box-shadow 0.2s ease-in-out;
  
  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
}

.shortcut-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--system-secondary-backgroundColor);
  }
  
  &.is-expanded {
    background-color: var(--system-secondary-backgroundColor);
    border-bottom: 1px solid var(--system-border-borderColor);
  }
  
  .shortcut-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    flex: 1;
    min-width: 0;
    
    i {
      color: var(--system-accent-backgroundColor2);
      flex-shrink: 0;
    }
    
    h4 {
      margin: 0;
      font-size: 1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }
  
  .shortcut-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
    margin-left: 0.5rem;
  }
}

.shortcut-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.shortcut-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  
  .section-label {
    font-size: 1rem;
    color: var(--system-text-primaryLabel);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  label {
    font-size: 0.9rem;
    color: var(--system-text-secondaryLabel);
    font-weight: 500;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}

.section-divider {
  height: 1px;
  background-color: var(--system-border-borderColor);
  margin: 0.75rem 0;
  opacity: 0.6;
}

.arguments-list, .parsers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.argument-item, .parser-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  background-color: var(--system-secondary-backgroundColor);
  padding: 6px;
  border-radius: 4px;
  
  .p-inputgroup {
    flex: 1;
    
    .p-inputtext {
      background-color: var(--system-sections-backgroundColor);
    }
  }
  
  .argument-actions, .parser-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }
}

.path-input {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0.5rem 0;
  
  .path-prefix {
    flex-shrink: 0;
    height: 36px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    color: var(--system-text-secondaryLabel);
    background-color: var(--system-neutral-02);
    border: 1px solid var(--system-border-borderColor);
    border-right: none;
    border-radius: 4px 0 0 4px;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  
  .p-inputtext {
    flex: 1;
    border-radius: 0 4px 4px 0;
  }
}

.hint-text {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--system-text-tertiaryLabel);
  padding: 0.5rem 0;
  
  i {
    margin-top: 2px;
  }
}

.empty-arguments, .empty-parsers {
  text-align: center;
  padding: 1rem;
  background-color: var(--system-secondary-backgroundColor);
  border-radius: 4px;
  color: var(--system-text-secondaryLabel);
  font-size: 0.9rem;
}

.parsers-section {
  .dropdown-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
    
    .no-parsers-note {
      color: var(--system-text-tertiaryLabel);
      font-style: italic;
      font-size: 0.8rem;
    }
  }
  
  .parser-dropdown {
    width: 100%;
    flex: 1;
  }
}

.parser-add-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.parsers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
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
      color: var(--system-accent-backgroundColor2);
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

.empty-parsers {
  text-align: center;
  padding: 1rem;
  color: var(--system-text-secondaryLabel);
  font-size: 0.9rem;
  font-style: italic;
}

.mt-2 {
  margin-top: 0.5rem;
}

/* Animation styles */
.shortcut-reorder-move {
  transition: transform 0.6s ease;
}

.shortcut-reorder-enter-active,
.shortcut-reorder-leave-active {
  transition: all 0.6s cubic-bezier(0.55, 0, 0.1, 1);
}

.shortcut-reorder-enter-from,
.shortcut-reorder-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.shortcut-reorder-leave-active {
  position: absolute;
}

/* Parser swap animation */
.parser-swap-move {
  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.parser-swap-enter-active {
  transition: all 0.4s ease-out;
}

.parser-swap-leave-active {
  transition: all 0.4s ease-in;
  position: absolute;
  width: 100%;
}

.parser-swap-enter-from,
.parser-swap-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.parser-swap-leave-active {
  z-index: 0;
}

.parser-swap-move {
  z-index: 1;
}

/* Argument swap animation */
.argument-swap-move {
  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  z-index: 1;
}

.argument-swap-enter-active {
  transition: all 0.4s ease-out;
}

.argument-swap-leave-active {
  transition: all 0.4s ease-in;
  position: absolute;
  width: 100%;
  z-index: 0;
}

.argument-swap-enter-from,
.argument-swap-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.arguments-transition-container,
.parsers-transition-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style> 
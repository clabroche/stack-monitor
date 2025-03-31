<template>
  <div class="configuration-container">
    <!-- Docker section -->
    <div class="section">
      <div class="section-header">
        <i class="fab fa-docker mr-2"></i>
        <span>Docker</span>
        <i v-tooltip="'Configure Docker container settings for your service'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="docker-config">
          <div class="docker-field">
            <div class="docker-label">Enabled</div>
            <div class="docker-switch">
              <InputSwitch v-model="service.container.enabled" @change="service.save()" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dockerfile section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-file-code mr-2"></i>
        <span>Dockerfile</span>
        <i v-tooltip="'Only Linux images are supported at the moment and commands will be run in a sh shell to support environment variables in arguments'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="editor-container">
          <Editor
            v-model="service.container.build"
            language="dockerfile"
            @change="service.save()"
            :pt="{
              root: { class: 'dockerfile-editor' },
              toolbar: { class: 'editor-toolbar' },
              editor: { class: 'editor-content' }
            }"
          />
        </div>
      </div>
    </div>

    <!-- User section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-user mr-2"></i>
        <span>User</span>
        <i v-tooltip="'Set the user and group for the container'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <EditableField
          v-model="service.container.user"
          placeholder="Default: <hostUser>:<hostGroup>"
          @save="service.save()"
        />
      </div>
    </div>

    <!-- Bootstrap commands section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-terminal mr-2"></i>
        <span>Bootstrap Commands</span>
        <i v-tooltip="'Commands to run when the container starts'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <TransitionGroup name="command-list" tag="div" class="commands-grid">
          <div v-for="(command, i) in service.container?.bootstrap?.commands || []" :key="`command-${i}`" class="command-card">
            <div class="command-card-content">
              <div class="command-inputs">
                <div class="command-field">
                  <div class="command-label">Entrypoint</div>
                  <EditableField
                    v-model="command.entrypoint"
                    placeholder="/bin/sh"
                    @save="service.save()"
                  />
                </div>
                <div class="command-field">
                  <div class="command-label">Command</div>
                  <EditableField
                    v-model="command.cmd"
                    placeholder="-c ''"
                    @save="service.save()"
                  />
                </div>
                <div class="command-field">
                  <div class="command-label">User:Group</div>
                  <EditableField
                    v-model="command.user"
                    placeholder="Default: <hostUser>:<hostGroup>"
                    @save="service.save()"
                  />
                </div>
              </div>
            </div>
            <div class="command-card-actions">
              <div class="reorder-actions">
                <Button v-if="i > 0" icon="fas fa-arrow-up" @click="moveCommand(i, i-1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-up" disabled text size="small" class="reorder-btn" />
                <Button v-if="i < (service.container?.bootstrap?.commands?.length || 0) - 1" icon="fas fa-arrow-down" @click="moveCommand(i, i+1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-down" disabled text size="small" class="reorder-btn" />
              </div>
              <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeCommand(i)" />
            </div>
          </div>
        </TransitionGroup>
        <div class="add-command mt-2">
          <Button label="Add Command" icon="fas fa-plus" @click="addCommand" class="compact-btn" />
        </div>
      </div>
    </div>

    <!-- Volumes section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-hdd mr-2"></i>
        <span>Volumes</span>
        <i v-tooltip="'Configure container volumes'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <TransitionGroup name="volume-list" tag="div" class="volumes-grid">
          <div v-for="(volume, i) in service.container?.volumes || []" :key="`volume-${i}`" class="volume-card">
            <div class="volume-card-content">
              <EditableField
                v-model="service.container.volumes[i]"
                placeholder="Enter volume path..."
                @save="service.save()"
              />
            </div>
            <div class="volume-card-actions">
              <div class="reorder-actions">
                <Button v-if="i > 0" icon="fas fa-arrow-up" @click="moveVolume(i, i-1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-up" disabled text size="small" class="reorder-btn" />
                <Button v-if="i < (service.container?.volumes?.length || 0) - 1" icon="fas fa-arrow-down" @click="moveVolume(i, i+1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-down" disabled text size="small" class="reorder-btn" />
              </div>
              <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeVolume(i)" />
            </div>
          </div>
        </TransitionGroup>
        <div class="add-volume mt-2">
          <Button label="Add Volume" icon="fas fa-plus" @click="addVolume" class="compact-btn" />
        </div>
      </div>
    </div>

    <!-- Ignore Volumes section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-ban mr-2"></i>
        <span>Ignore Volumes</span>
        <i v-tooltip="'Volumes to ignore in the container'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <TransitionGroup name="volume-list" tag="div" class="volumes-grid">
          <div v-for="(volume, i) in service.container?.ignoreVolumes || []" :key="`ignore-volume-${i}`" class="volume-card">
            <div class="volume-card-content">
              <EditableField
                v-model="service.container.ignoreVolumes[i]"
                placeholder="Enter volume path to ignore..."
                @save="service.save()"
              />
            </div>
            <div class="volume-card-actions">
              <div class="reorder-actions">
                <Button v-if="i > 0" icon="fas fa-arrow-up" @click="moveIgnoreVolume(i, i-1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-up" disabled text size="small" class="reorder-btn" />
                <Button v-if="i < (service.container?.ignoreVolumes?.length || 0) - 1" icon="fas fa-arrow-down" @click="moveIgnoreVolume(i, i+1)" text size="small" class="reorder-btn" />
                <Button v-else icon="fas fa-arrow-down" disabled text size="small" class="reorder-btn" />
              </div>
              <Button icon="fas fa-times" severity="danger" text size="small" class="remove-btn" @click="removeIgnoreVolume(i)" />
            </div>
          </div>
        </TransitionGroup>
        <div class="add-volume mt-2">
          <Button label="Add Ignore Volume" icon="fas fa-plus" @click="addIgnoreVolume" class="compact-btn" />
        </div>
      </div>
    </div>

    <!-- Shared Volume section -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-share-alt mr-2"></i>
        <span>Shared Volume</span>
        <i v-tooltip="'Configure shared volume for the container'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <EditableField
          v-model="service.container.sharedVolume"
          placeholder="Enter shared volume path..."
          @save="service.save()"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import Editor from '../../../../fronts/app/src/components/Editor.vue';
import EditableField from './EditableField.vue';
import { TransitionGroup } from 'vue';

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

function addCommand() {
  if (!props.service.container.bootstrap.commands) props.service.container.bootstrap.commands = [];
  props.service.container.bootstrap.commands.push({ user: '$UID:$GID', cmd: '-c ""', entrypoint: '/bin/sh' });
  props.service.save();
}

function removeCommand(index) {
  props.service.container.bootstrap.commands?.splice(index, 1);
  props.service.save();
}

function moveCommand(fromIndex, toIndex) {
  if (!props.service.container.bootstrap.commands) return;
  const [command] = props.service.container.bootstrap.commands.splice(fromIndex, 1);
  props.service.container.bootstrap.commands.splice(toIndex, 0, command);
  props.service.save();
}

function addVolume() {
  if (!props.service.container.volumes) props.service.container.volumes = [];
  props.service.container.volumes.push('');
  props.service.save();
}

function removeVolume(index) {
  props.service.container.volumes?.splice(index, 1);
  props.service.save();
}

function moveVolume(fromIndex, toIndex) {
  if (!props.service.container.volumes) return;
  const [volume] = props.service.container.volumes.splice(fromIndex, 1);
  props.service.container.volumes.splice(toIndex, 0, volume);
  props.service.save();
}

function addIgnoreVolume() {
  if (!props.service.container.ignoreVolumes) props.service.container.ignoreVolumes = [];
  props.service.container.ignoreVolumes.push('');
  props.service.save();
}

function removeIgnoreVolume(index) {
  props.service.container.ignoreVolumes?.splice(index, 1);
  props.service.save();
}

function moveIgnoreVolume(fromIndex, toIndex) {
  if (!props.service.container.ignoreVolumes) return;
  const [volume] = props.service.container.ignoreVolumes.splice(fromIndex, 1);
  props.service.container.ignoreVolumes.splice(toIndex, 0, volume);
  props.service.save();
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

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.docker-config {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.docker-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.docker-label {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--system-text-secondaryLabel);
}

.editor-container {
  width: 100%;
  height: 300px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--system-border-borderColor);
  background-color: var(--system-secondary-backgroundColor);

  :deep(.monaco) {
    height: 100%;
  }
}

.commands-grid,
.volumes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.command-card,
.volume-card {
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
}

.command-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.command-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.command-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.command-label {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--system-text-secondaryLabel);
}

.command-card-actions,
.volume-card-actions {
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

.compact-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

.command-list-move,
.command-list-enter-active,
.command-list-leave-active,
.volume-list-move,
.volume-list-enter-active,
.volume-list-leave-active {
  transition: all 0.3s ease;
}

.command-list-enter-from,
.command-list-leave-to,
.volume-list-enter-from,
.volume-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.command-list-leave-active,
.volume-list-leave-active {
  position: absolute;
}
</style> 
<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Configuration</h2>
      <Button size="small" icon="fas fa-trash" label="Remove" severity="danger" @click="remove"/>
    </div>
    <Tree :value="nodes"  v-model:expandedKeys="expandedKeys" :style="{width: 'max-content'}">
      <template #default="slotProps">
        <div class="line">
          <div class="column">
            <b class="label">{{ slotProps.node.label }}</b>
            <span class="description" v-if="slotProps.node.description">{{ slotProps.node.description }}</span>
          </div>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" :style="{justifyContent:'flex-start'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #inputtext="slotProps">
        <div class="line">
          <template v-if="slotProps.node.inputLabel">
            <IftaLabel>
              <InputText v-if="slotProps?.node?.model"
                v-model="slotProps.node.model.obj[slotProps.node.model.key]"
                size="small"
                @blur="slotProps.node.save"
                @keypress.enter="slotProps.node.save"
              />
              <label>{{ slotProps.node.inputLabel }}</label>
            </IftaLabel>
          </template>
          <template v-else>
            <InputText v-if="slotProps?.node?.model"
              v-model="slotProps.node.model.obj[slotProps.node.model.key]"
              size="small"
              @blur="slotProps.node.save"
              @keypress.enter="slotProps.node.save"
            />
          </template>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" fluid :style="{justifyContent:'flex-start'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #textarea="slotProps">
        <div class="line">
          <Textarea v-if="slotProps?.node?.model"
            v-model="slotProps.node.model.obj[slotProps.node.model.key]"
            size="small"
            @blur="slotProps.node.save"
            @keypress.enter="slotProps.node.save"
          ></Textarea>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" fluid :style="{justifyContent:'flex-start'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #switch="slotProps">
        <div class="line">
          <ToggleSwitch v-if="slotProps?.node?.model"
            v-model="slotProps.node.model.obj[slotProps.node.model.key]"
            size="small"
            @blur="slotProps.node.save"
            @change="slotProps.node.save"
          ></ToggleSwitch>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" fluid :style="{justifyContent:'flex-start'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #editor="slotProps">
        <div class="line">
          <Editor :language="slotProps.node.language || 'plain/text'" :style="{height: '400px', minWidth:'600px'}"
            :additionalOptions="{
              minimap: { enabled: false },
              lineNumbers: 'off',
              automaticLayout: true
            }"
            v-model="slotProps.node.model.obj[slotProps.node.model.key]"
            @blur="slotProps.node.save"
          ></Editor>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" fluid :style="{justifyContent:'flex-start'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #button="{node}">
        <Button @click="node.click" size="small" :severity="node.severity" fluid :style="{justifyContent:'flex-start'}">
          <i v-if="node.buttonIcon" :class="node.buttonIcon"></i>
          {{ node.label }}
        </Button>
      </template>
      <template #select="{node}">
        <Select :options="node.options?.value || node.options || []" fluid
          optionLabel="label"
          optionValue="id"
          :defaultValue="node.value"
          @change="node.onChange"
        ></Select>
      </template>
    </Tree>
  </section-cmp>
  <ModalEditEnvs ref="modalEditEnvsRef" :service="service"></ModalEditEnvs>
  <Modal ref="modalShowEnvRef" :no-cancel="true" validateString="Close" :maxHeight="'80vh'" :noScroll="false">
      <template>
      </template>
      <template #body="{data: envs}">
        <div v-if="envs">
          <div class="line">
            <h2>Current environment</h2>
            <Button label="Download" icon="fas fa-download" size="small" @click="exportEnv(envs)"/>
          </div>
          <DataTable scrollable class="datatable" size="small"  sortField="key" :sortOrder="1"
            :value="parseRawEnvs(envs)"
            tableStyle="width: 100%;">
            <Column field="key" header="Key" col></Column>
            <Column field="value" header="Value" col></Column>
          </DataTable>
        </div>
      </template>
  </Modal>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import Tree from 'primevue/tree';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import IftaLabel from 'primevue/iftalabel';
import ToggleSwitch from 'primevue/toggleswitch';
import Service from '../../../../fronts/app/src/models/service';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';
import Modal from '../../../../fronts/app/src/components/Modal.vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';
import ModalEditEnvs from './ModalEditEnvs.vue';
import stack from '../../../../fronts/app/src/models/stack';
import Parsers from '../../../../fronts/app/src/models/Parsers';

export default {
  components: {
    sectionCmp: SectionVue,
    ModalEditEnvs,
    Tree,
    IftaLabel,
    Button,
    InputText,
    Modal,
    DataTable,
    Column,
    Select,
    Textarea,
    ToggleSwitch,
  },
  props: {
    service: {
      /** @type {import('../../../../fronts/app/src/models/service').default | null} */
      default: null,
      required: true,
      type: Service,
    },
  },
  setup(props) {
    const modalEditEnvsRef = ref();
    const modalShowEnvRef = ref();
    const currentEnvironment = ref();
    const parsers = ref([]);
    const save = () => {
      axios.post('/stack/create-service', props.service)
        .then(() => notification.next('success', 'Configuration sauvegardée'));
    };
    const nodes = computed(() => ([
      {
        key: 'general',
        label: 'General',
        icon: 'fas fa-home',
        children: [
          {
            key: 'general-description',
            label: 'Description',
            description: props.service.description,
            children: [
              {
                type: 'inputtext',
                model: {
                  obj: props.service,
                  key: 'description',
                },
                save,
              },
            ],
          }, {
            key: 'general-url',
            label: 'URL',
            description: props.service.url,
            children: [
              {
                type: 'inputtext',
                model: {
                  obj: props.service,
                  key: 'url',
                },
                save,
              },
            ],
          },
        ],
      },
      {
        key: 'groups',
        label: 'Groups',
        icon: 'fas fa-home',
        description: props.service.groups?.join(', '),
        children: [
          ...props.service.groups?.map((group, i) => ({
            key: `group-${i}`,
            type: 'inputtext',
            model: {
              obj: props.service.groups,
              key: i,
            },
            buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { props.service.groups?.splice(i, 1); save(); } }],
            save,
          })) || [],
          {
            key: 'group-add',
            type: 'button',
            label: 'Add new group',
            buttonIcon: 'fas fa-plus',
            click: () => props.service.groups?.push(''),
          },
        ],
      },
      {
        key: 'git',
        label: 'Git',
        icon: 'fab fa-git-alt',
        description: props.service.git?.home,
        children: [
          {
            key: 'git-home',
            label: 'home',
            description: props.service.git?.home,
            children: [
              {
                key: 'git-home',
                type: 'inputtext',
                model: {
                  obj: props.service.git || {},
                  key: 'home',
                },
                save,
              },
            ],
          },
          {
            key: 'git-remote',
            label: 'remote',
            description: props.service.git?.remote,
            children: [
              {
                key: 'git-remote',
                type: 'inputtext',
                model: {
                  obj: props.service.git || {},
                  key: 'remote',
                },
                save,
              },
            ],
          },
        ],
      },
      {
        key: 'service-parsers',
        icon: 'fas fa-scroll',
        label: 'Parsers',
        description: props.service.parsers?.map((parserId) => {
          const parser = parsers.value.find((p) => p.id === parserId);
          return parser?.label;
        }).join(', '),
        children: [
          ...props.service.parsers?.map((parserId, i) => ({
            key: `service-parser-${i}`,
            label: parsers.value.find((p) => p.id === parserId)?.label,
            buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { props.service.parsers?.splice(i, 1); save(); } }],
            save,
          })) || [],
          {
            type: 'select',
            model: {
              obj: props.service.spawnOptions,
              key: 'cwd',
            },
            options: parsers.value.filter((parser) => !(props.service.parsers || []).includes(parser.id)),
            onChange({ value }) {
              if (!props.service.parsers) props.service.parsers = [];
              props.service.parsers.push(value);
              save();
            },
            value: '',
            save,
          },
        ],
      },
      {
        key: 'service-container',
        icon: 'fab fa-docker',
        label: 'Docker',
        children: [
          {
            key: 'service-container-switch',
            type: 'switch',
            model: {
              obj: props.service.container,
              key: 'enabled',
            },
            save,
          },
          {
            key: 'service-container-build',
            label: 'Dockerfile',
            children: [
              {
                key: 'service-container-build-input',
                type: 'editor',
                language: 'dockerfile',
                model: {
                  obj: props.service.container,
                  key: 'build',
                },
                save,
              },
            ],
          }, {
            key: 'service-container-bootstrap',
            label: 'Bootstrap',
            description: props.service.container?.bootstrap.commands.map((a) => `${a.entrypoint} ${a.cmd}`)?.join(', '),
            children: [
              ...props.service.container?.bootstrap.commands?.map((command, i) => ({
                key: `service-container-bootstrap-${i}`,
                label: `${command.entrypoint} ${command.cmd}`,
                children: [
                  {
                    type: 'inputtext',
                    inputLabel: 'Entrypoint',
                    model: {
                      obj: props.service.container?.bootstrap.commands[i],
                      key: 'entrypoint',
                    },
                    save,
                  },
                  {
                    type: 'inputtext',
                    inputLabel: 'Command',
                    model: {
                      obj: props.service.container?.bootstrap.commands[i],
                      key: 'cmd',
                    },
                    save,
                  },
                  {
                    type: 'inputtext',
                    inputLabel: 'User:Group',
                    model: {
                      obj: props.service.container?.bootstrap.commands[i],
                      key: 'user',
                    },
                    save,
                  },
                  {
                    type: 'button',
                    severity: 'danger',
                    label: 'Delete command',
                    buttonIcon: 'fas fa-trash',
                    click: () => { props.service.container?.bootstrap.commands?.splice(i, 1); save(); },
                  },
                ],
              })) || [],
              {
                key: 'contaienr-command-add',
                type: 'button',
                label: 'Add new command',
                buttonIcon: 'fas fa-plus',
                click: () => props.service.container.bootstrap.commands?.push({ user: '$UID:$GID', cmd: '-c ""', entrypoint: '/bin/sh' }),
              },
            ],
          }, {
            key: 'service-container-volumes',
            label: 'Volumes',
            description: props.service.container?.volumes?.join(', '),
            children: [
              ...props.service.container?.volumes?.map((_, i) => ({
                key: `service-container-volumes-${i}`,
                type: 'inputtext',
                model: {
                  obj: props.service.container?.volumes,
                  key: i,
                },
                buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { props.service.container?.volumes?.splice(i, 1); save(); } }],
                save,
              })) || [],
              {
                key: 'volume-add',
                type: 'button',
                label: 'Add new volume',
                buttonIcon: 'fas fa-plus',
                click: () => props.service.container.volumes.push(''),
              },
            ],
          }, {
            key: 'service-container-ignoreVolumes',
            label: 'Ignore volumes',
            description: props.service.container?.ignoreVolumes?.join(', '),
            children: [
              ...props.service.container?.ignoreVolumes?.map((_, i) => ({
                key: `service-container-ignoreVolumes-${i}`,
                type: 'inputtext',
                model: {
                  obj: props.service.container?.ignoreVolumes,
                  key: i,
                },
                buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { props.service.container?.ignoreVolumes?.splice(i, 1); save(); } }],
                save,
              })) || [],
              {
                key: 'volume-add',
                type: 'button',
                label: 'Add new ignored volume',
                buttonIcon: 'fas fa-plus',
                click: () => props.service.container.ignoreVolumes.push(''),
              },
            ],
          }, {
            key: 'service-container-sharedVolumes',
            label: 'Shared volumes',
            description: props.service.container?.sharedVolume,
            children: [
              {
                key: 'service-container-sharedVolume-input',
                label: 'Shared volume',
                description: props.service.container?.sharedVolume,
                type: 'inputtext',
                model: {
                  obj: props.service.container,
                  key: 'sharedVolume',
                },
                save,
              }
            ]
          },
        ],
      },
      {
        key: 'commands',
        label: 'Commands',
        icon: 'fas fa-terminal',
        description: `${props.service.commands?.length} command(s)`,
        children: [
          ...props.service.commands?.map((command, commandIndex) => ({
            key: `command-${commandIndex}`,
            label: `${command.spawnCmd} ${command.spawnArgs.join(' ')}`?.trim() || 'Put a command below...',
            children: [
              {
                key: `command-${commandIndex}-command`,
                label: 'Command',
                description: command.spawnCmd,
                children: [
                  {
                    type: 'inputtext',
                    model: {
                      obj: command,
                      key: 'spawnCmd',
                    },
                    save,
                  },
                ],
              }, {
                key: `command-${commandIndex}-argument`,
                label: 'Arguments',
                description: command.spawnArgs?.join(', '),
                children: [
                  ...command.spawnArgs?.map((argument, i) => ({
                    key: `command-${commandIndex}-argument-${i}`,
                    type: 'inputtext',
                    model: {
                      obj: command.spawnArgs,
                      key: i,
                    },
                    buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { command.spawnArgs?.splice(i, 1); save(); } }],
                    save,
                  })) || [],
                  {
                    key: 'argument-add',
                    type: 'button',
                    label: 'Add new argument',
                    buttonIcon: 'fas fa-plus',
                    click: () => command.spawnArgs?.push(''),
                  },
                ],
              }, {
                key: `command-${commandIndex}-path`,
                label: 'Path',
                description: command.spawnOptions?.cwd,
                children: [
                  {
                    type: 'inputtext',
                    model: {
                      obj: command.spawnOptions,
                      key: 'cwd',
                    },
                    save,
                  },
                ],
              }, {
                key: `command-${commandIndex}-parsers`,
                icon: 'parsers',
                label: 'Parsers',
                description: command.parsers?.map((parserId) => {
                  const parser = parsers.value.find((p) => p.id === parserId);
                  return parser?.label;
                }).join(', '),
                children: [
                  ...command.parsers?.map((parserId, i) => ({
                    key: `command-${commandIndex}-parser-${i}`,
                    label: parsers.value.find((p) => p.id === parserId)?.label,
                    buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { command.parsers?.splice(i, 1); save(); } }],
                    save,
                  })) || [],
                  {
                    type: 'select',
                    model: {
                      obj: command.spawnOptions,
                      key: 'cwd',
                    },
                    options: parsers.value.filter((parser) => !(command.parsers || []).includes(parser.id)),
                    onChange({ value }) {
                      if (!command.parsers) command.parsers = [];
                      command.parsers.push(value);
                      save();
                    },
                    value: '',
                    save,
                  },
                ],
              }, {
                key: `command-${commandIndex}-env`,
                buttonIcon: 'fas fa-edit',
                label: 'Edit envs',
                type: 'button',
                click: () => editEnvForCommand(command, commandIndex),
              }, {
                key: `command-${commandIndex}-env`,
                label: 'Show envs',
                buttonIcon: 'fas fa-eye',
                type: 'button',
                click: async () => {
                  const { data: exportedEnv } = await axios.get('/stack/export-env', { params: { environment: currentEnvironment.value.label, service: props.service.label, commandIndex } });
                  await modalShowEnvRef.value.open(exportedEnv).promise;
                },
              }, {
                key: `command-${commandIndex}-env`,
                label: 'Delete command ',
                buttonIcon: 'fas fa-trash',
                type: 'button',
                severity: 'danger',
                click: () => { props.service.commands?.splice(commandIndex, 1); save(); },
              },
            ],
          })) || [],
          {
            key: 'group-add',
            type: 'button',
            label: 'Add new Command',
            buttonIcon: 'fas fa-plus',
            click: async () => {
              if (!props.service.commands) return;
              props.service.commands.push({ spawnOptions: { cwd: '', envs: { [currentEnvironment.value.label]: { extends: [], envs: [] } } }, spawnArgs: [], spawnCmd: '' });
              expandedKeys.value[`command-${props.service.commands.length - 1}`] = true;
              expandedKeys.value[`command-${props.service.commands.length - 1}-argument`] = true;
              expandedKeys.value[`command-${props.service.commands.length - 1}-command`] = true;
              expandedKeys.value[`command-${props.service.commands.length - 1}-path`] = true;
              await save();
              stack.loadServices();
            },
          },
        ],
      },
    ]));

    const expandedKeys = ref({
      general: true,
      commands: true,
    });
    const expandAll = () => {
      for (const node of nodes.value) {
        console.log(node);
        if (node.key === 'commands') {
          for (const nodeCommand of node.children) {
            expandedKeys.value[nodeCommand.key] = true;
          }
        }
      }
      expandedKeys.value = { ...expandedKeys.value };
    };
    onMounted(async () => {
      expandAll();
      currentEnvironment.value = await stack.getEnvironment();
      parsers.value = await Parsers.all();
    });
    async function editEnvForCommand(command, commandIndex) {
      const result = await modalEditEnvsRef.value.open({ command, commandIndex });
      if (result) return save();
      return null;
    }
    async function exportEnv(envObject) {
      const envString = Object.keys(envObject).map((key) => `${key}=${envObject[key]}`).join('\n');
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(envString)}`);
      element.setAttribute('download', '.env');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    function parseRawEnvs(envs) {
      return Object.keys(envs).map((key) => ({ key, value: envs[key] }));
    }
    return {
      modalEditEnvsRef,
      modalShowEnvRef,
      exportEnv,
      parseRawEnvs,
      expandedKeys,
      nodes,
      save,
      remove() {
        axios.delete(`/stack/${props.service.label}`)
          .then(() => notification.next('success', 'Service supprimé'));
      },
    };
  },
};
</script>
<style lang="scss" scoped>
$grey: var(--system-border-borderColor);
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
  }
  input {
    height: max-content;
  }
}
.line {
  display: flex;
  align-items: center;
}
.label {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 200px;
  display: inline-block;
}
.description {
  color: var(--system-tertiary-color);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 200px;
  display: inline-block;
}
.column {
  display: flex;
  flex-direction: column;
}
.line {
  display: flex;
  justify-content: space-between;
}
::v-deep {
  .p-tree-node-label {
    flex-grow: 1;
  }
}
</style>

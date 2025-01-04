<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Configuration</h2>
      <div class="line">
        <Button size="small" icon="fas fa-copy" label="Duplicate" @click="duplicate"/>
        <Button size="small" icon="fas fa-trash" label="Remove" severity="danger" @click="remove"/>
      </div>
    </div>
    <Tree :value="nodes"  v-model:expandedKeys="expandedKeys">
       <template #nodeicon="{node: {svgIcon, icon}}">
        <div v-html="svgIcon" v-if="svgIcon" :style="{width: '15px', display: 'flex'}"></div>
        <i :class="icon" v-else></i>
    </template>
      <template #default="slotProps">
        <div class="line">
          <div class="column">
            <b class="label">{{ slotProps.node.label }}</b>
            <span class="description" v-if="slotProps.node.description">{{ slotProps.node.description }}</span>
          </div>
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" :style="{justifyContent:'flex-start', width: 'max-content'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #inputtext="slotProps">
        <div class="line">
          <Button v-for="button of slotProps.node.buttons || []" :key="button.label"
            :severity="button.severity" :style="{justifyContent:'flex-start',width: 'max-content'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
          <InputGroup fluid>
            <InputGroupAddon v-if="slotProps.node.beforeText">{{slotProps.node.beforeText}}</InputGroupAddon>
            <template v-if="slotProps.node.inputLabel">
              <IftaLabel fluid full :style="{display: 'inline-grid',flexGrow: '1'}">
                <InputText v-if="slotProps?.node?.model"
                  v-model="slotProps.node.model.obj[slotProps.node.model.key]"
                  size="small"
                  :placeholder="slotProps.node.placeholder"
                  :type="slotProps.node.inputType || 'text'"
                  @blur="slotProps.node.save"
                  @keypress.enter="slotProps.node.save"
                  :style="{width: '100%'}"
                />
                <label>{{ slotProps.node.inputLabel }}</label>
              </IftaLabel>
            </template>
            <template v-else>
              <InputText v-if="slotProps?.node?.model"
                v-model="slotProps.node.model.obj[slotProps.node.model.key]"
                :placeholder="slotProps.node.placeholder"
                size="small"
                :type="slotProps.node.inputType || 'text'"
                fluid
                @blur="slotProps.node.save"
                @keypress.enter="slotProps.node.save"
              />
            </template>
          </InputGroup>

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
            :severity="button.severity" fluid :style="{justifyContent:'flex-start', width: 'max-content'}"
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
            :severity="button.severity" fluid :style="{justifyContent:'flex-start', width: 'max-content'}"
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
            :severity="button.severity" fluid :style="{justifyContent:'flex-start', width: 'max-content'}"
            size="small"
            @click="button.action">
            <i :class="button.icon"/>
            {{button.label}}
          </Button>
        </div>
      </template>
      <template #button="{node}">
        <Form
          @submit="($ev) => {node.click($ev.states.value.value); $ev.reset() }"
          v-if="node.inputtext"
          :style="{display: 'flex'}">
          <FormField v-slot="$field" initialValue="" name="value" :style="{width: '100%'}" >
            <InputText size="small" />
          </FormField>
          <Button
            type="submit"
            size="small"
            :severity="node.severity"
            fluid
            :style="{justifyContent:'flex-start', width: 'max-content'}">
            <i v-if="node.buttonIcon" :class="node.buttonIcon"></i>
            {{ node.label }}
          </Button>
        </Form>
        <Button v-else
            @click="node.click"
            size="small"
            :severity="node.severity"
            fluid
            :style="{justifyContent:'flex-start', width: 'max-content'}">
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
  <Modal
  ref="duplicateModalRef"
  cancelString="Cancel"
  validateString="Duplicate"
  :disabled="duplicateModalDisabled">
    <template #header>
        Duplication
      </template>
      <template #body>
        <IftaLabel>
          <InputText size="small" fluid v-model="labelOfDuplicatedService"></InputText>
          <label>Name of the duplicated service</label>
        </IftaLabel>
      </template>
  </Modal>
  <Modal
  ref="removeModalRef"
  cancelString="Cancel"
  validateString="Remove">
    <template #header>
        Remove
      </template>
      <template #body>
        <IftaLabel>
          Are you sure to delete this service ?
        </IftaLabel>
      </template>
  </Modal>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Tree from 'primevue/tree';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import IftaLabel from 'primevue/iftalabel';
import ToggleSwitch from 'primevue/toggleswitch';
import { v4 as uuid } from 'uuid';
import { Form, FormField } from '@primevue/forms';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
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
    Form,
    Button,
    InputText,
    FormField,
    Modal,
    DataTable,
    Column,
    Select,
    Textarea,
    ToggleSwitch,
    InputGroup,
    InputGroupAddon,
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
    const router = useRouter();
    const parsers = ref([]);
    const save = () => {
      props.service.save()
        .then(() => notification.next('success', 'Configuration saved'))
        .catch(() => notification.next('error', 'Cannot save configuration'));
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
          {
            key: 'rootpath',
            label: 'Root path',
            icon: 'home',
            description: props.service.rootPath,
            children: [
              {
                type: 'inputtext',
                model: {
                  obj: props.service,
                  key: 'rootPath',
                },
                save,
              },
            ],
          },
        ],
      }, {
        key: 'general-health',
        label: 'Health check',
        icon: 'fas fa-heart',
        description: `${props.service.health?.enabled ? 'Enabled' : 'Disabled'}:  ${props.service.health?.url || ''}`,
        children: [
          {
            type: 'switch',
            model: {
              obj: props.service.health,
              key: 'enabled',
            },
            save,
          }, {
            type: 'select',
            options: [
              { id: 'GET', label: 'GET' },
              { id: 'POST', label: 'POST' },
              { id: 'PATCH', label: 'PATCH' },
              { id: 'PUT', label: 'PUT' },
              { id: 'DELETE', label: 'DELETE' },
            ],
            onChange({ value }) {
              if (!props.service.health) return;
              props.service.health.method = value;
              save();
            },
            value: props.service.health?.method,
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'URL',
            model: {
              obj: props.service.health,
              key: 'url',
            },
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'Return code',
            inputType: 'number',
            model: {
              obj: props.service.health,
              key: 'returnCode',
            },
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'Return text',
            model: {
              obj: props.service.health,
              key: 'responseText',
            },
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'Interval (ms)',
            inputType: 'number',
            model: {
              obj: props.service.health,
              key: 'interval',
            },
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'Timeout (ms)',
            inputType: 'number',
            model: {
              obj: props.service.health,
              key: 'timeout',
            },
            save,
          }, {
            type: 'inputtext',
            inputLabel: 'Start after (ms)',
            inputType: 'number',
            model: {
              obj: props.service.health,
              key: 'startAfter',
            },
            save,
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
          ...props.service.parsers?.map((parserId, i) => {
            const parser = parsers.value.find((p) => p.id === parserId);
            return {
              key: `service-parser-${i}`,
              label: parser?.label,
              buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { props.service.parsers?.splice(i, 1); save(); } }],
              save,
            };
          }) || [],
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
        key: 'openapi-url',
        label: 'Openapi Url',
        svgIcon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Swagger</title><path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12c6.616 0 12-5.383 12-12S18.616 0 12 0zm0 1.144c5.995 0 10.856 4.86 10.856 10.856 0 5.995-4.86 10.856-10.856 10.856-5.996 0-10.856-4.86-10.856-10.856C1.144 6.004 6.004 1.144 12 1.144zM8.37 5.868a6.707 6.707 0 0 0-.423.005c-.983.056-1.573.517-1.735 1.472-.115.665-.096 1.348-.143 2.017-.013.35-.05.697-.115 1.038-.134.609-.397.798-1.016.83a2.65 2.65 0 0 0-.244.042v1.463c1.126.055 1.278.452 1.37 1.629.033.429-.013.858.015 1.287.018.406.073.808.156 1.2.259 1.075 1.307 1.435 2.575 1.218v-1.283c-.203 0-.383.005-.558 0-.43-.013-.591-.12-.632-.535-.056-.535-.042-1.08-.075-1.62-.064-1.001-.175-1.988-1.153-2.625.503-.37.868-.812.983-1.398.083-.41.134-.821.166-1.237.028-.415-.023-.84.014-1.25.06-.665.102-.937.9-.91.12 0 .235-.017.369-.027v-1.31c-.16 0-.31-.004-.454-.006zm7.593.009a4.247 4.247 0 0 0-.813.06v1.274c.245 0 .434 0 .623.005.328.004.577.13.61.494.032.332.031.669.064 1.006.065.669.101 1.347.217 2.007.102.544.475.95.941 1.283-.817.549-1.057 1.333-1.098 2.215-.023.604-.037 1.213-.069 1.822-.028.554-.222.734-.78.748-.157.004-.31.018-.484.028v1.305c.327 0 .627.019.927 0 .932-.055 1.495-.507 1.68-1.412.078-.498.124-1 .138-1.504.032-.461.028-.927.074-1.384.069-.715.397-1.01 1.112-1.057a.972.972 0 0 0 .199-.046v-1.463c-.12-.014-.204-.027-.291-.032-.536-.023-.804-.203-.937-.71a5.146 5.146 0 0 1-.152-.993c-.037-.618-.033-1.241-.074-1.86-.08-1.192-.794-1.753-1.887-1.786zm-6.89 5.28a.844.844 0 0 0-.083 1.684h.055a.83.83 0 0 0 .877-.78v-.046a.845.845 0 0 0-.83-.858zm2.911 0a.808.808 0 0 0-.834.78c0 .027 0 .05.004.078 0 .503.342.826.859.826.507 0 .826-.332.826-.853-.005-.503-.342-.836-.855-.831zm2.963 0a.861.861 0 0 0-.876.835c0 .47.378.849.849.849h.009c.425.074.853-.337.881-.83.023-.457-.392-.854-.863-.854z"/></svg>',
        description: props.service.openapiURL,
        children: [
          {
            type: 'inputtext',
            model: {
              obj: props.service,
              key: 'openapiURL',
            },
            save,
          },
        ],
      },
      {
        key: 'service-container',
        icon: 'fab fa-docker',
        label: 'Docker',
        description: `${props.service.container?.enabled ? 'Enabled' : 'Disabled'}:  ${props.service.container?.build?.split('\n')?.[0] || ''}`,
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
            description: props.service.container?.build?.split('\n')?.[0] || '',
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
            key: 'service-container-user',
            label: 'User',
            description: props.service.container?.user,
            children: [
              {
                key: 'service-container-user-input',
                label: 'Shared volume',
                description: props.service.container?.user,
                type: 'inputtext',
                placeholder: 'Default: <hostUser>:<hostGroup>',
                model: {
                  obj: props.service.container,
                  key: 'user',
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
                    placeholder: 'Default: <hostUser>:<hostGroup>',
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
              },
            ],
          },
        ],
      },
      {
        key: 'metadata',
        label: 'Metadata',
        icon: 'fas fa-list',
        description: Object.keys(props.service.meta || {}).map((metaKey) => `${metaKey}=${props.service.meta[metaKey]}`).join(','),
        children: [
          ...Object.keys(props.service.meta || {}).map((metaKey) => ({
            key: `metadata-${metaKey}`,
            inputLabel: metaKey,
            description: props.service.meta?.[metaKey],
            type: 'inputtext',
            model: {
              obj: props.service.meta,
              key: metaKey,
            },
            buttons: [{ severity: 'danger', icon: 'fas fa-trash', action: () => { delete props.service.meta[metaKey]; save(); } }],
            save,
          })),
          {
            key: 'metadata-add',
            type: 'button',
            label: 'Add new Metadata',
            buttonIcon: 'fas fa-plus',
            inputtext: true,
            click: (metaKey) => {
              props.service.meta[metaKey] = '';
              save();
            },
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
                description: `${command.spawnOptions?.cwd || ''}`,
                children: [
                  {
                    type: 'inputtext',
                    beforeText: `${props.service.rootPath || '.'}`,
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
              props.service.commands.push({
                id: uuid(), spawnOptions: { cwd: '', envs: { [currentEnvironment.value.label]: { extends: [], envs: [] } } }, spawnArgs: [], spawnCmd: '',
              });
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
    const removeModalRef = ref();
    const duplicateModalRef = ref();
    const labelOfDuplicatedService = ref('');
    return {
      duplicateModalRef,
      labelOfDuplicatedService,
      modalEditEnvsRef,
      modalShowEnvRef,
      exportEnv,
      parseRawEnvs,
      expandedKeys,
      nodes,
      removeModalRef,
      save,
      duplicateModalDisabled: computed(() => !labelOfDuplicatedService.value
          || stack.services.value.find((a) => a.label === labelOfDuplicatedService.value)),
      async remove() {
        const result = await removeModalRef.value.open().promise;
        if (!result) return;
        axios.delete(`/stack/${props.service.label}`)
          .then(() => {
            notification.next('success', 'Service supprimé');
            router.push({ name: 'stack-single-no-view' });
          });
      },
      async duplicate() {
        const result = await duplicateModalRef.value.open().promise;
        if (!result) return;

        axios.put(`/stack/${props.service.label}/duplicate`, { label: labelOfDuplicatedService.value })
          .then(() => {
            notification.next('success', 'Service duplicated');
            const label = labelOfDuplicatedService.value;
            router.push({ name: 'stack-single', params: { label }, query: { tab: 'Configuration' } });
          })
          .catch(() => {
            notification.next('error', 'Cant duplicate service');
          }).finally(() => {
            labelOfDuplicatedService.value = '';
          });
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
  display: inline-block;
  text-overflow: ellipsis;
  overflow: hidden;
}
.description {
  color: var(--system-tertiary-color);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: inline-block;
}
.column {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.line {
  display: flex;
  justify-content: space-between;
}
::v-deep {
  .p-tree-node-label {
    flex-grow: 1;
    overflow: hidden;
  }
}
</style>

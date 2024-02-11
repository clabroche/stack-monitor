import LogsVue from '@clabroche/modules-logs-front/src/Logs.vue';
import GitVue from '@clabroche/modules-git-front/src/Git.vue';
import NotUpToDate from '@clabroche/modules-git-front/src/NotUpToDate.vue';
import NpmVue from '@clabroche/modules-npm-front/src/Npm.vue';
import BugsVue from '@clabroche/modules-bugs-front/src/Bugs.vue';
import ConfigsVue from '@clabroche/modules-configuration-front/src/Configs.vue';
import OpenAI from '@clabroche/modules-openai-front/src/OpenAi.vue';
import Toolbox from '@clabroche/modules-toolbox-front/src/Toolbox.vue';
import UUID from '@clabroche/modules-uuid-front/src/UUID.vue';
import JWT from '@clabroche/modules-jwt-front/src/Index.vue';
import Mongo from '@clabroche/modules-mongo-front/src/Index.vue';
import NodeREPL from '@clabroche/modules-node-repl-front/src/Index.vue';
import Diff from '@clabroche/modules-diff-front/src/Index.vue';
import Regex from '@clabroche/modules-regex-front/src/Index.vue';
import JSONFormatter from '@clabroche/modules-json-formatter-front/src/Index.vue';
import Documentation from '@clabroche/modules-documentation-front/src/Index.vue';
import DevOps from '@clabroche/modules-dev-ops-front/src/Index.vue';
import Github from '@clabroche/modules-github-front/src/Index.vue';
import Kanban from '@clabroche/modules-kanban-front/src/Index.vue';
import GlobalScripts from '@clabroche/modules-global-scripts-front/src/Index.vue';
import Finder from '@clabroche/modules-finder-front/src/Index.vue';
import Help from '@clabroche/modules-help-front/src/Index.vue';
import DynamicComponent from './DynamicComponent.vue';

const toolboxPlugins = [
  { name: 'JWT', component: JWT },
  { name: 'Finder', component: Finder },
  { name: 'Git-NotUpToDate', component: NotUpToDate },
  { name: 'Regex', component: Regex },
  { name: 'UUID', component: UUID },
  { name: 'JSONFormatter', component: JSONFormatter },
  { name: 'Diff', component: Diff },
  { name: 'NodeREPL', component: NodeREPL },
  { name: 'Mongo', component: Mongo },
  { name: 'Help', component: Help },
  { name: 'OpenAI', component: OpenAI },
  { name: 'GlobalScripts', component: GlobalScripts },
  { name: 'Kanban', component: Kanban },
  {
    name: 'Toolbox',
    component: Toolbox,
    children: [
      {
        path: ':plugin',
        props: true,
        component: DynamicComponent,
      },
    ],
  },
  {
    name: 'DevOps',
    component: DevOps,
    children: [
      {
        path: ':plugin',
        props: true,
        component: DynamicComponent,
      },
    ],
  },
];

/**
 * @type {{
 *  name: string, cmp: import('vue').Component, routes?: import('vue-router').RouteRecordRaw[]
 * }[]}
 * */
const plugins = [
  { name: 'DynamicComponent', cmp: DynamicComponent },
  ...toolboxPlugins.map(({ name, component, children }) => ({
    name,
    cmp: component,
    routes: [
      {
        path: `/${name}`,
        name,
        component,
        children,
      },
    ],
  })),
  { name: 'Help', cmp: Help },
  { name: 'Logs', cmp: LogsVue },
  { name: 'Git', cmp: GitVue },
  { name: 'Github', cmp: Github },
  { name: 'Documentation', cmp: Documentation },
  { name: 'Npm', cmp: NpmVue },
  { name: 'Bugs', cmp: BugsVue },
  { name: 'Configuration', cmp: ConfigsVue },
];
export default plugins;

/**
 * @template T
 * @typedef {{
 *  name: string,
 *  displayName: string,
*   description?: string,
 *  icon?: string,
 *  order?: number,
 *  hidden?: (
 *    service: import('../../../../servers/server/models/Service') | null,
 *    stack: typeof import('../../../../servers/server/models/stack'),
 *  ) => Promise<boolean> | boolean,
 *  routes?: (stackMonitor: import('../../../../servers/server/models/stack')) => import('express').Router,
 *  export: T,
 *  finder?: (search: string, stackMonitor: typeof import('../../../../servers/server/models/stack')) => import('../../../finder/backend/routes').FinderChoice[] | Promise<import('../../../finder/backend/routes').FinderChoice[]>
 *  placements: ({
 *    label: string,
 *    position?: 'toolbox' | 'sidebar' | 'dev-ops',
 *    icon?: string,
 *    iconText?: string,
 *    goTo?: import('vue-router').RouteLocationRaw | string,
 *    active: string
 *  } | 'toolbox' | 'sidebar' | 'dev-ops' | 'service' | 'global')[]
 * }} PluginSM
 */

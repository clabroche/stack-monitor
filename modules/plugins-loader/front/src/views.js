/* eslint-disable import/no-relative-packages */
/* eslint-disable import/no-useless-path-segments */
import LogsVue from '../../../../modules/logs/front/src/Logs.vue';
import GitVue from '../../../../modules/git/front/src/Git.vue';
import NotUpToDate from '../../../../modules/git/front/src/NotUpToDate.vue';
import NpmVue from '../../../../modules/npm/front/src/Npm.vue';
import BugsVue from '../../../../modules/bugs/front/src/Bugs.vue';
import ConfigsVue from '../../../../modules/configuration/front/src/Configs.vue';
import OpenAI from '../../../../modules/openai/front/src/OpenAi.vue';
import Toolbox from '../../../../modules/toolbox/front/src/Toolbox.vue';
import UUID from '../../../../modules/uuid/front/src/UUID.vue';
import JWT from '../../../../modules/jwt/front/src/Index.vue';
import Mongo from '../../../../modules/mongo/front/src/Index.vue';
import NodeREPL from '../../../../modules/node-repl/front/src/Index.vue';
import Diff from '../../../../modules/diff/front/src/Index.vue';
import Regex from '../../../../modules/regex/front/src/Index.vue';
import JSONFormatter from '../../../../modules/json-formatter/front/src/Index.vue';
import Documentation from '../../../../modules/documentation/front/src/Index.vue';
import DevOps from '../../../../modules/dev-ops/front/src/Index.vue';
import Github from '../../../../modules/github/front/src/Index.vue';
import Kanban from '../../../../modules/kanban/front/src/Index.vue';
import GlobalScripts from '../../../../modules/global-scripts/front/src/Index.vue';
import Finder from '../../../../modules/finder/front/src/Index.vue';
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

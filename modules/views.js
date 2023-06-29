import LogsVue from './logs/Logs.vue'
import GitVue from './git/Git.vue'
import NotUpToDate from './git/NotUpToDate.vue'
import NpmVue from './npm/Npm.vue'
import BugsVue from './bugs/Bugs.vue'
import ConfigsVue from './configuration/Configs.vue'
import OpenAI from "./openai/OpenAi.vue";
import Toolbox from "./toolbox/Toolbox.vue";
import DynamicComponent from "./DynamicComponent.vue";
import UUID from "./uuid/UUID.vue";
import JWT from "./jwt/Index.vue";
import Mongo from "./mongo/Index.vue";
import NodeREPL from "./node-repl/Index.vue";
import Diff from "./diff/Index.vue";
import Regex from "./regex/Index.vue";
import JSONFormatter from "./json-formatter/Index.vue";
import Documentation from "./documentation/Index.vue";
import DevOps from "./dev-ops/Index.vue";
import Github from "./github/Index.vue";
import Kanban from "./kanban/Index.vue";
import GlobalScripts from "./global-scripts/Index.vue";
import Finder from "./finder/Index.vue";

const toolboxPlugins = [
  { name: 'JWT', component: JWT },
  { name: "Finder", component: Finder },
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
  { name: 'Toolbox', component: Toolbox ,children: [
    {
      path: ":plugin",
      props: true,
      component: DynamicComponent,
    },
  ] },
  { name: 'DevOps', component: DevOps ,children: [
    {
      path: ":plugin",
      props: true,
      component: DynamicComponent,
    },
  ] },
]

/** 
 * @type {{
 *  name: string, cmp: import('vue').Component, routes?: import('vue-router').RouteRecordRaw[]
 * }[]}
 * */
const plugins = [
  { name: "DynamicComponent", cmp: DynamicComponent },
  ...toolboxPlugins.map(({name, component, children}) => ({
    name,
    cmp: component,
    routes: [
      {
        path: `/${name}`,
        name,
        component: component,
        children,
      },
    ],
  })),
  { name: "Logs", cmp: LogsVue },
  { name: "Git", cmp: GitVue },
  { name: "Github", cmp: Github },
  { name: "Documentation", cmp: Documentation },
  { name: "Npm", cmp: NpmVue },
  { name: "Bugs", cmp: BugsVue },
  { name: "Configuration", cmp: ConfigsVue },
];
export default plugins


/**
 * @template T
 * @typedef {{
 *  name: string,
 *  displayName: string,
*   description?: string,
 *  icon?: string,
 *  order?: number,
 *  hidden?: (service: import('../server/models/Service')) => Promise<boolean> | boolean,
 *  routes?: (stackMonitor: typeof import('../server/models/stack')) => import('express').Router,
 *  export: T,
 *  finder?: (search: string, stackMonitor: typeof import('../server/models/stack')) => import('./finder/routes').FinderChoice[] | Promise<import('./finder/routes').FinderChoice[]>
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
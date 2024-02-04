import LogsVue from '@clabroche/modules-logs/Logs.vue'
import GitVue from '@clabroche/modules-git/Git.vue'
import NotUpToDate from '@clabroche/modules-git/NotUpToDate.vue'
import NpmVue from '@clabroche/modules-npm/Npm.vue'
import BugsVue from '@clabroche/modules-bugs/Bugs.vue'
import ConfigsVue from '@clabroche/modules-configuration/Configs.vue'
import OpenAI from "@clabroche/modules-openai/OpenAi.vue";
import Toolbox from "@clabroche/modules-toolbox/Toolbox.vue";
import DynamicComponent from "./DynamicComponent.vue";
import UUID from "@clabroche/modules-uuid/UUID.vue";
import JWT from "@clabroche/modules-jwt/Index.vue";
import Mongo from "@clabroche/modules-mongo/Index.vue";
import NodeREPL from "@clabroche/modules-node-repl/Index.vue";
import Diff from "@clabroche/modules-diff/Index.vue";
import Regex from "@clabroche/modules-regex/Index.vue";
import JSONFormatter from "@clabroche/modules-json-formatter/Index.vue";
import Documentation from "@clabroche/modules-documentation/Index.vue";
import DevOps from "@clabroche/modules-dev-ops/Index.vue";
import Github from "@clabroche/modules-github/Index.vue";
import Kanban from "@clabroche/modules-kanban/Index.vue";
import GlobalScripts from "@clabroche/modules-global-scripts/Index.vue";
import Finder from "@clabroche/modules-finder/Index.vue";

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
 *  hidden?: (
 *    service: import('../../servers/server/models/Service') | null,
 *    stack: typeof import('../../servers/server/models/stack'),
 *  ) => Promise<boolean> | boolean,
 *  routes?: (stackMonitor: import('../../servers/server/models/stack')) => import('express').Router,
 *  export: T,
 *  finder?: (search: string, stackMonitor: typeof import('../../servers/server/models/stack')) => import('../finder/routes').FinderChoice[] | Promise<import('../finder/routes').FinderChoice[]>
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
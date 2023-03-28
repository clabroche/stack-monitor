import LogsVue from './logs/Logs.vue'
import GitVue from './git/Git.vue'
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

const toolboxPlugins = [
  { name: 'JWT', component: JWT },
  { name: 'Regex', component: Regex },
  { name: 'UUID', component: UUID },
  { name: 'JSONFormatter', component: JSONFormatter },
  { name: 'Diff', component: Diff },
  { name: 'NodeREPL', component: NodeREPL },
  { name: 'Mongo', component: Mongo },
  { name: 'OpenAI', component: OpenAI },
  { name: 'Toolbox', component: Toolbox ,children: [
    {
      path: ":plugin",
      props: true,
      component: DynamicComponent,
    },
  ] },
]

export default [
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
  { name: "Npm", cmp: NpmVue },
  { name: "Bugs", cmp: BugsVue },
  { name: "Configuration", cmp: ConfigsVue },
];
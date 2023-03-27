import LogsVue from './logs/Logs.vue'
import GitVue from './git/Git.vue'
import NpmVue from './npm/Npm.vue'
import BugsVue from './bugs/Bugs.vue'
import ConfigsVue from './configuration/Configs.vue'
import OpenAi from "./openai/OpenAi.vue";
import Toolbox from "./toolbox/Toolbox.vue";
import DynamicComponent from "./DynamicComponent.vue";
import UUID from "./uuid/UUID.vue";

export default [
  { name: "DynamicComponent", cmp: DynamicComponent },
  {
    name: "UUID",
    cmp: UUID,
    routes: [
      {
        path: "/uuid",
        name: "uuid",
        component: UUID,
      },
    ],
  },
  { name: "Logs", cmp: LogsVue },
  { name: "Git", cmp: GitVue },
  { name: "Npm", cmp: NpmVue },
  { name: "Bugs", cmp: BugsVue },
  { name: "Configuration", cmp: ConfigsVue },
  {
    name: "Toolbox",
    cmp: Toolbox,
    routes: [
      {
        path: "/toolbox",
        name: "toolbox",
        component: Toolbox,
        children: [
          {
            path: ":plugin",
            props: true,
            component: DynamicComponent,
          },
        ],
      },
    ],
  },
  {
    name: "OpenAI",
    cmp: OpenAi,
  },
];
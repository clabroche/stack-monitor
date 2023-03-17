import LogsVue from './logs/Logs.vue'
import GitVue from './git/Git.vue'
import NpmVue from './npm/Npm.vue'
import BugsVue from './bugs/Bugs.vue'
import ConfigsVue from './configuration/Configs.vue'
import OpenAi from './openai/OpenAi.vue'

export default [
  {name: 'Logs',cmp: LogsVue},
  {name: 'Git',cmp: GitVue},
  {name: 'Npm',cmp: NpmVue},
  {name: 'Bugs',cmp: BugsVue},
  { name: 'Configuration', cmp: ConfigsVue },
  {
    name: 'OpenAI', cmp: OpenAi, routes: [
      {
        path: '/openai',
        name: 'openai',
        component: OpenAi
      },
    ]
  },
]
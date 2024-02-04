---
outline: deep
---

# Extended Options

You should use this format to extends capacities of stack monitor:

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} */
module.exports = (stackMonitor) => {
  return {
    //... Global Options
    services: [] // Services Options...
  }
}
```
 - To view services options go to [Service Options](/reference/service-options)
 - To view Global options go to [Global Options](/reference/global-options)

## Log Parser

See [Global Options](/reference/global-options#log-parsers)

## Environments

You can let the application switch from one environment to another with a simple dropdown:

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {
  const env = stackMonitor.setEnvironments({
    LOCAL: {
      label: 'Local',
      envs: require('./env.local'),
      color: 'white',
      bgColor: '#074971'
    },
    PREPROD: {
      label: 'Preprod',
      envs: require('./env.preprod'),
      color: '#0000ff',
      bgColor: '#0000ff'
    }
  }, 'LOCAL')
  return {
    //... Global Options
    services: [
      {
        // Services Options...
        commands: [
          //... Command Options
          spawnOptions: {
            env: {
              PORT: env?.SERVER_PORT,
              mongoDbURL: env?.mongoDbURL,
            }
          }
        ]
      }
    ]
  }
}
```
![Local Environment](/imgs/change-environments.png)
![Dev Environment](/imgs/change-environments-dev.png)

## Hooks

You can listen some hooks:

### onLaunch
::: info Type
**callback**: () => void
:::

Trigger when you choose all services to launch and you launch them

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {

  stackMonitor.onLaunch(() => {
    const message = stackMonitor.getEnabledServices()
      .map(service => ` - ${service.label}`)
      .join('\n')
    console.log('These services are launched:')
    console.log(message)
  })

  return {
    services: []
  }
}
```


### onServiceRestart
::: info Type
**callback**: (service: Service) => void
:::

Trigger when a service is restarted

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {

  stackMonitor.onServiceRestart((service) => {
    console.log('↻', service?.label, 'restarted')
  })

  return {
    services: []
  }
}
```


### onServiceStart
::: info Type
**callback**: (service: Service) => void
:::

Trigger when a service is started

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {

  stackMonitor.onServiceStart((service) => {
    console.log('▶️', service?.label, 'started')
  })

  return {
    services: []
  }
}
```


### onServiceKill
::: info Type
**callback**: (service: Service) => void
:::

Trigger when a service is killed

```js [js]
/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {

  stackMonitor.onServiceKill((service) => {
    console.log('🗰', service?.label, 'killed')
  })

  return {
    services: []
  }
}
```


## Scripts

You can build your own scripts and execute them in stack-monitor:

::: code-group
```js [./stack.js]
const githubTagsScript = require('./scripts/github-tags')

/** @type {import('@iryu54/stack-monitor').StackFile} Load typings for autocomplete */
module.exports = (stackMonitor) => {
  
  stackMonitor.globalScripts.addScript(githubTagsScript(stackMonitor))

  return {
    watchFiles: [
      require.resolve('./scripts/github-tags'),
    ],
    services: []
  }
}
```
```js [./scripts/github-tags]
const PromiseB = require('bluebird')
const Octokit = require('octokit')

/**
 * @param {import('@iryu54/stack-monitor').StackMonitor} stackMonitor 
 * @returns {import('@iryu54/stack-monitor').GlobalScript}
 */
const script = (stackMonitor) => ({
  label: 'github:tags',
  pipeline: [
    {
      id: 'requirements',
      label: 'Requirements',
      script: async () => {
        if (!process.env.GH_APIKEY) throw new Error('Add GH_APIKEY dans le .env')
        const octokit = new Octokit.Octokit({ auth: process.env.GH_APIKEY })
        const { data: { login } } = await octokit.rest.users.getAuthenticated();
        return {
          GH_APIKEY: process.env.GH_APIKEY,
          logged_as: login,
          octokit,
        }
      },
      print(output) {
        return `Logged in Github as ${output.requirements.logged_as}`
      }
    },


    {
      id: 'getServices',
      label: 'Get services',
      script: () => {
        return stackMonitor.getServices().filter(s => s.git?.home)
      },
      print(output) {
        return output.getServices.length + ' services found'
      }
    },


    {
      id: 'continue',
      label: 'Continue',
      prompt: {
        question: 'Continue ?',
        type: 'boolean',
        defaultValue: () => (true),
        validation: (value) => {
          if (!value) return 'You must accept to continue'
          return null
        }
      },
      print: () => 'ok'
    },


    {
      id: 'promptService',
      label: 'Choose services',
      prompt: {
        question: 'Which services to choose ?',
        type: 'multi-select',
        options: async (output) => stackMonitor.getServices().map(s => ({
          label: s.label,
          value: s.label,
        })),
        defaultValue: () => ([]),
        validation: async (value) => {
          if (!value) return 'You should provide a value'
          return null
        },
      },
      script: async (output, prompts) => {
        return (prompts.promptService).map(serviceName => stackMonitor.findService(serviceName))
      },
      print(output) {
        return output.promptService.length + ' services choosed'
      }
    },


    {
      id: 'promptNbTags',
      label: 'Number of tags to fetch',
      prompt: {
        question: 'Type number of tags',
        type: 'number',
        defaultValue: () => (1),
        validation: async (value) => {
          if (!value) return 'You should provide a value'
          return null
        },
      },
      print(output, prompts) {
        return prompts.promptNbTags + ' to display'
      }
    },


    {
      id: 'result',
      label: 'Result',
      print: async (output, prompts) => {
        const services = output.promptService
        const servicesTags = await PromiseB.map(services, async service => {
          const [owner, repo] = `${new URL(service.git.home).pathname.replace('.git', '')}`.split('/').slice(-2)
          /** @type {import('octokit').Octokit} */
          const octokit = output.requirements.octokit
          const { data: tags } = await octokit.rest.repos.listTags({ owner, repo })
          return { service, tags }
        })
        return `
            <h4>Services chosen: </h4>
            <ul>
              ${servicesTags?.map(({ service, tags }) => {
          return `<li>
                  ${service.label}: 
                  <ul>
                    ${tags.slice(0, prompts.promptNbTags).map(tag => (`<li>${tag.name}</li>`)).join('')}
                  </ul>
                </li>`
        }).join('')}
            </ul>
          `
      }
    }
  ]
})
module.exports = script
```
:::
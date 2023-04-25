const PromiseB = require('bluebird')
const Octokit = require('octokit')

/**
 * @param {import('../../typings/index').StackMonitor} stackMonitor 
 * @returns {import('../../typings/index').GlobalScript}
 */
const script = (stackMonitor) => ({
  label: 'github:tags',
  pipeline: [
    {
      id: 'requirements',
      label: 'Pré-requis',
      script: async () => {
        if (!process.env.GH_APIKEY) throw new Error('Veuillez renseigner votre GH_APIKEY dans le .env')
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
      label: 'Récupération des services',
      script: () => {
        return stackMonitor.getServices().filter(s => s.git?.home)
      },
      print(output) {
        return output.getServices.length + ' services trouvés'
      }
    },


    {
      id: 'continue',
      label: 'Continuer',
      prompt: {
        question: 'Voulez-vous continuer ?',
        type: 'boolean',
        defaultValue: () => (true),
        validation: (value) => {
          if (!value) return 'Vous devez accepter pour continuer'
          return null
        }
      },
      print: () => 'ok'
    },


    {
      id: 'promptService',
      label: 'Choisir des services',
      prompt: {
        question: 'Quelle service choisir ?',
        type: 'multi-select',
        options: async (output) => stackMonitor.getServices().map(s => ({
          label: s.label,
          value: s.label,
        })),
        defaultValue: () => (['Platform']),
        validation: async (value) => {
          if (!value) return 'You should provide a value'
          return null
        },
      },
      script: async (output, prompts) => {
        return (prompts.promptService).map(serviceName => stackMonitor.findService(serviceName))
      },
      print(output) {
        return output.promptService.length + ' services choisis'
      }
    },


    {
      id: 'promptNbTags',
      label: 'Nombres de tags à récupérer',
      prompt: {
        question: 'Veuillez indiquer le nombre de tags à récupérer ',
        type: 'number',
        defaultValue: () => (1),
        validation: async (value) => {
          if (!value) return 'You should provide a value'
          return null
        },
      },
      print(output, prompts) {
        return prompts.promptNbTags + ' à afficher'
      }
    },


    {
      id: 'showServices',
      label: 'Voir les services',
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
            <h4>Services choisis: </h4>
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
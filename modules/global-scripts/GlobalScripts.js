const { v4 } = require("uuid");

/**@type {GlobalScript[]} */
const globalScripts = []
/**@type {Record<string, TrackStep>}*/
const currentScriptsByCommunicationId = {}

/** @param {import('../../typings/export').StackMonitor} stackMonitor */
const GlobalScripts = (stackMonitor) => {
  const {Socket} = stackMonitor
  return {
    /** @param {GlobalScript} script */
    addScript(script) {
      const index = globalScripts.findIndex(s => s.label === script.label)
      if (index>=0) {
        globalScripts.splice(index, 1)
      }
      globalScripts.push(script)
      stackMonitor.Socket.io?.emit('reloadScripts')
    },
    getScripts() {
      return globalScripts
    },
    /** @param {string} label */
    getScript(label) {
      const scripts = this.getScripts()
      const script = scripts.find(s => s.label === label)
      return script;
    },
    /**
     * @param {string} scriptId 
     * @param {string} stepLabel 
     */
    getStep(scriptId, stepLabel) {
      const script = this.getScript(scriptId)
      if (!script) return
      const step = script.pipeline.find(st => st.id === stepLabel)
      if (!step) return
      return step
    },
    /** @param {string} id */
    launchScript(id) {
      if (!Socket.io) throw new Error('Socket not ready')
      const script = this.getScript(id)
      if (!script) throw new Error(`Script ${id} not found`)
      const communicationId = v4()

      /** @type {TrackStep} */
      const track = {
        scriptId: script.label,
        currentStep: script.pipeline[0].id,
        loadingStep: script.pipeline[0].id,
        steps: {},
        output: {},
        prompts: {},
      }
      currentScriptsByCommunicationId[communicationId] = track
      /** @param {import("./GlobalScripts").GlobalScript['pipeline'][number]} step */
      function getStepIndex(step) {
        return (script?.pipeline || []).indexOf(step)
      }
      Socket.on(communicationId, async (
      /** @type {import('socket.io').Socket} */ socket,
      /** @type {string} */ event,
      /** @type {any} */ data
      ) => {
        /**@type {ScriptStep | undefined} */
        let step
        while (step = this.getStep(script.label, track.currentStep)) {
          const index = getStepIndex(step)
          const nextStep = index >= 0 ? script.pipeline[index + 1]?.id : ''
          track.loadingStep = step.id
          track.steps[track.currentStep] = {
            ...track.steps[track.currentStep],
            isValidated: false,
            error: undefined,
            printData: undefined,
          }
          socket.emit(communicationId, 'track', track)

          try {
            if (step.skip) {
              const shouldSkip = await step.skip(track.output, track.prompts)
              if(shouldSkip) {
                track.steps[track.currentStep].skipped = true
                track.loadingStep = ''
                track.currentStep = nextStep
                socket.emit(communicationId, 'track', track)
                continue
              }
            }
          } catch (error) {
            console.error('Script error')
            console.error(error)
            track.steps[track.currentStep].error = error.message || error
            break;
          }

          const shouldBreak = await prompt(step, track, event, data)
          if(shouldBreak) break
          if (event === 'validate-prompt') event = ''
          
          if (step.script) {
            try {
              track.output[track.currentStep] = await step.script(track.output, track.prompts)
            } catch (error) {
              console.error('Script error')
              console.error(error)
              track.steps[track.currentStep].error = error.message || error
              break;
            }
          }

          if (step.print) {
            try {
              track.steps[track.currentStep].printData = await step.print(track.output, track.prompts)
              await new Promise(resolve => setTimeout(() => {resolve(null)}, 0)) // It will not pass to next step without this if step is very fast
            } catch (error) {
              console.error('Print error')
              console.error(error)
              track.steps[track.currentStep].error = error.message || error
              break;
            }
          }

          track.steps[track.currentStep].isValidated = true
          track.currentStep = nextStep
        }
        track.loadingStep = ''
        socket.emit(communicationId, 'track', track)
      })
      return communicationId
    }
  }
}

module.exports = GlobalScripts

/**
 * 
 * @param {ScriptStep} step 
 * @param {TrackStep} track 
 * @param {string} event
 * @param {any} data
 * @returns 
 */
async function prompt(step, track, event, data) {
  if (!step.prompt) return false
  if (event === 'validate-prompt') {
    if (step.prompt?.validation) {
      try {
        const msgError = await step.prompt.validation(data)
        if (msgError) {
          track.steps[track.currentStep].error = msgError
          return true
        }
        track.prompts[track.currentStep] = data
      } catch (error) {
        console.error('Script error')
        console.error(error)
        track.steps[track.currentStep].error = error.message || error
        return true
      }
    } else {
      track.prompts[track.currentStep] = data
    }
    return false
  }
  if (step.prompt.defaultValue) {
    try {
      const defaultValue = await step.prompt.defaultValue(track.output)
      track.steps[track.currentStep].promptValue = defaultValue
    } catch (error) {
      console.error('Script error')
      console.error(error)
      track.steps[track.currentStep].error = error.message || error
      return true
    }
  }
  if (step.prompt.options) {
    try {
      const options = await step.prompt.options(track.output)
      track.steps[track.currentStep].promptOptions = options
    } catch (error) {
      console.error('Script error')
      console.error(error)
      track.steps[track.currentStep].error = error.message || error
      return true
    }
  }
  
  return true
}

/**
 * @typedef {{
 *    label: string,
 *    id: string,
 *    skip?: (output: Record<string, any>, prompts: Record<string, any>) => boolean | Promise<boolean>
 *    prompt?:{
 *      question: string,
 *      options?: (output: Record<string, any>) => ({label: string, value: string}[]) | Promise<{label: string, value: string}[]>,
 *      defaultValue?: (output: Record<string, any>) => any,
 *      type?: 'string' | 'number' | 'boolean' | 'array' | 'select'| 'multi-select',
*       validation?: (value: any) => (string | null) | Promise<string | null>
 *    },
 *    script?: (output: Record<string, any>,prompts: Record<string, any>) => any,
 *    print?: (output: Record<string, any>, prompts: Record<string, any>) => any,
 *  }} ScriptStep 
 */

/**
 * @typedef {{
 *  label: string,
 *  pipeline: ScriptStep[]}} GlobalScript
 */

/**
 * @typedef {{
 *  scriptId: string,
 *  currentStep: string,
 *  loadingStep: string,
 *  steps: Record<string, {
 *    error?: string,
 *    isValidated: boolean,
 *    skipped?: boolean,
 *    printData?: string,
 *    promptValue?: string,
 *    promptOptions?: {label: string, value: string}[],
 *  }>
 *  output: Record<string, any>
 *  prompts: Record<string, any>
 * }} TrackStep
 */
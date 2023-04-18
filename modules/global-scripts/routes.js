const express = require("express");
const Stack = require("../../server/models/stack");
const { v4 } = require("uuid");
const Socket = require("../../server/models/socket");
const router = express.Router();

/**
 * @type {Record<string, TrackStep>}
*/
const currentScriptsByCommunicationId = {}

router.get("/", async (req, res) => {
  res.json(Stack.devops.getGlobalScripts());
});

router.get("/:id", async (req, res) => {
  const scripts = Stack.devops.getGlobalScripts()
  const script = scripts.find(s => s.label === req.params.id)
  if (!script) return res.status(404).send(`Script ${req.params.id} not found`)
  res.json(script);
});

router.post("/:id", async (req, res) => {
  if (!Socket.io) return res.status(400).send('Socket not ready')
  const scripts = Stack.devops.getGlobalScripts()
  const script = scripts.find(s => s.label === req.params.id)
  if (!script) return res.status(404).send(`Script ${req.params.id} not found`)
  const communicationId = v4()

  /** @type {TrackStep} */
  const track = {
    scriptId: script.label,
    currentStep: script.pipeline[0].id,
    steps: {},
    output: {},
    prompts: {},
  }
  currentScriptsByCommunicationId[communicationId] = track
  function getStep() {
    if (!script) return
    const step = script.pipeline.find(st => st.id === track.currentStep)
    if (!step) return
    return step
  }
  /** @param {import("../../server/models/stack").GlobalScript['pipeline'][number]} step */
  function getStepIndex(step) {
    return (script?.pipeline || []).indexOf(step)
  }
  Socket.on(communicationId, async (
    /** @type {import('socket.io').Socket} */ socket,
    /** @type {string} */ event,
    /** @type {any} */ data
  ) => {
    while (!!getStep()) {
      const step = getStep()
      if (!step) break
      track.steps[track.currentStep] = {
        isValidated: false,
      }

      if (step.prompt) {
        if (step.prompt.defaultValue) {
          const defaultValue = await step.prompt.defaultValue(track.output)
          track.steps[track.currentStep].promptValue = defaultValue
        }
        if (step.prompt.options) {
          const options = await step.prompt.options(track.output)
          track.steps[track.currentStep].promptOptions = options
        }
        if(event !== 'prompt') {
          break
        }
        event=''
        if (step.prompt?.validation) {
          const msgError = await step.prompt.validation(data)
          if (msgError) {
            track.steps[track.currentStep].error = msgError
            break
          }
          track.prompts[track.currentStep] = data
        }
      }

      if(step.script) {
        try {
          track.output[track.currentStep] = await step.script(track.output, track.prompts)
        } catch (error) {
          console.error('Script error')
          console.error(error)
          track.steps[track.currentStep].error = error.message
          break;
        }
      }

      if(step.print) {
        try {
          track.steps[track.currentStep].printData = await step.print(track.output, track.prompts)
        } catch (error) {
          console.error('Script error')
          console.error(error)
          track.steps[track.currentStep].error = error.message
          break;
        }
      }

      const index = getStepIndex(step)
      track.steps[track.currentStep].isValidated = true
      if (index >= 0) {
        track.currentStep = script.pipeline[index + 1]?.id
      } else {
        track.currentStep = ''
      }
    }
    socket.emit(communicationId, 'track', track)
  })
  res.json(communicationId);
});

module.exports = router;

/**
 * @typedef {{
 *  scriptId: string,
 *  currentStep: string,
 *  steps: Record<string, {
 *    error?: string,
 *    isValidated: boolean,
 *    printData?: string,
 *    promptValue?: string,
 *    promptOptions?: {label: string, value: string}[],
 *  }>
 *  output: Record<string, any>
 *  prompts: Record<string, any>
 * }} TrackStep
 */
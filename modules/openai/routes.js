const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const { Configuration, OpenAIApi } = require('openai');
const { existsSync, mkdirSync } = require('fs');
const homedir = require('os').homedir();
const confDir = pathfs.resolve(homedir, '.stack-monitor')

if (!existsSync(confDir)) mkdirSync(confDir)
const openaiConfPath = pathfs.resolve(confDir, 'openaiconf.json')
if(!fse.existsSync(openaiConfPath)) fse.writeJSONSync(openaiConfPath, {})
const openaiconf = fse.readJsonSync(openaiConfPath)
/** @type {OpenAIApi} */
let openai = new OpenAIApi(new Configuration({
  apiKey: openaiconf.apikey,
}));

router.get('/', async (req, res) => {
  res.json('hello')
})

router.get('/models', async (req, res) => {
  const models = await openai.listModels({

  })
  res.json(models.data)
})

router.post('/chat/:room', async (req, res) => {
  const { message, model, temperature } = req.body
  if (!openaiconf?.chat) openaiconf.chat = {}
  if (!openaiconf?.chat?.[req.params.room]) openaiconf.chat[req.params.room] = {}
  if (!openaiconf?.chat?.[req.params.room]?.messages) openaiconf.chat[req.params.room].messages = [
    { "role": "system", "content": "Tu es un assistant utile." }
  ]
  const messages = openaiconf?.chat[req.params.room]?.messages
  messages.push({ "role": "user", "content": message })
  const result = await openai.createChatCompletion({
    model: model || "gpt-3.5-turbo",
    temperature: Number.isNaN(+temperature) ? 0 : +temperature,
    n:1,
    max_tokens: Infinity,
    messages: messages
      .filter(f => f?.content)
      .map(a => ({ role: a.role, content: a.content}))
      .slice(-5)
  }).catch(err => {
    console.error(err.response.data)
    return Promise.reject(err)
  });
  if (result?.data?.choices?.[0]?.message) {
    const { usage } = result.data
    const { message } = result.data.choices[0]
    messages.push({
      ...message,
      ...usage
    })
  }
  save()
  res.json(messages)

})


router.get('/rooms', async (req, res) => {
  res.json(Object.keys(openaiconf?.chat || {}))
})
router.post('/rooms', async (req, res) => {
  const { room } = req.body
  if (!openaiconf?.chat?.[room]) {
    if (!openaiconf?.chat) openaiconf.chat = {}
    if (!openaiconf?.chat?.[room]) openaiconf.chat[room] = {}
  }
  save()
  res.json(Object.keys(openaiconf?.chat))
})

router.delete('/rooms/:room', async (req, res) => {
  const { room } = req.params
  if (openaiconf?.chat?.[room]) delete openaiconf.chat[room]
  save()
  res.json(Object.keys(openaiconf?.chat))
})

router.get('/chat/:room', async (req, res) => {
  res.json(openaiconf?.chat?.[req.params.room]?.messages)
})



router.post('/apikey', async (req, res) => {
  const {apikey} = req.body
  openaiconf.apikey = apikey
  save()
  openai = new OpenAIApi(new Configuration({
    apiKey: openaiconf.apikey,
  }));

  res.json(true)
})

router.get('/ready', async (req, res) => {
  res.json(!!openaiconf?.apikey)
})

function save() {
  fse.writeJsonSync(openaiConfPath, openaiconf)
}
module.exports = router;
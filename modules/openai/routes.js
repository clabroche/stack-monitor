const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const OpenAIApi = require('openai').OpenAI;
const { existsSync, mkdirSync } = require('fs');
const homedir = require('os').homedir();
const confDir = pathfs.resolve(homedir, '.stack-monitor')
const { encode } = require('gpt-3-encoder');
const { v4 } = require('uuid');
if (!existsSync(confDir)) mkdirSync(confDir)
const openaiConfPath = pathfs.resolve(confDir, 'openaiconf.json')
if(!fse.existsSync(openaiConfPath)) fse.writeJSONSync(openaiConfPath, {})
const openaiconf = fse.readJsonSync(openaiConfPath)
/** @type {OpenAIApi | null} */
let openai = openaiconf.apikey ? new OpenAIApi({
  apiKey: openaiconf.apikey,
}) : null;


module.exports = () => {
  router.get('/openai/', async (req, res) => {
    res.json('hello')
  })
  
  router.get('/openai/models', async (req, res) => {
    const models = await openai.models.list({})
    res.json(models.data)
  })
  
  router.post('/openai/tokenize', async (req, res) => {
    const encoded = encode(req.body.data)
    res.json({
      nbTokens: encoded.length,
      price: encoded.length * 0.002 / 1000
    })
  })
  
  router.post('/openai/review', async (req, res) => {
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      n: 1,
      max_tokens: Infinity,
      messages: [
        { "role": "system", "content": `You are a developer for 10 years. You are expert in git and you should write a commit. I gave you a git diff after. Write me a resume of this diff and write me a commit for this diff in this format: "<fix|feat|major>: <your message not exceeding 60 characters>"` },
        { "role": "assistant", "content": req.body.data },
      ]
    }).catch(err => {
      console.error(err.response.data)
      return Promise.reject(err)
    });
    res.json(result.choices[0]?.message?.content || 'Cannot respond')
  })
  router.post('/openai/error', async (req, res) => {
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      n: 1,
      max_tokens: Infinity,
      messages: [
        { "role": "system", "content": `You are a developer for 20 years. You are expert in it and you should find a solution to this following error. Resume the following error and try to fix it` },
        { "role": "assistant", "content": req.body.data },
      ]
    }).catch(err => {
      console.error(err.response.data)
      return Promise.reject(err)
    });
    res.json(result.choices[0]?.message?.content || 'Cannot respond')
  })
  
  router.post('/openai/chat/:room', async (req, res) => {
    const { message, model, temperature } = req.body
    if (!openaiconf?.chat) openaiconf.chat = {}
    if (!openaiconf?.chat?.[req.params.room]) openaiconf.chat[req.params.room] = {}
    if (!openaiconf?.chat?.[req.params.room]?.messages) openaiconf.chat[req.params.room].messages = [
      { "role": "system", "content": "Tu es un assistant utile." }
    ]
    /** @type {import('./index').OpenAiChat[]} */
    const messages = openaiconf?.chat[req.params.room]?.messages || []
    messages.push({ 
      _id: v4(),
      role: "user",
      content: message,
      created_at: new Date().toISOString()
    })
    const result = await openai.chat.completions.create({
      model: model || "gpt-3.5-turbo",
      temperature: Number.isNaN(+temperature) ? 0 : +temperature,
      n:1,
      max_tokens: Infinity,
      messages: messages
        .filter(f => f?.content)
        .map(a => ({ role: a.role || 'user', content: a.content || ''}))
        .slice(-15)
    }).catch(err => {
      return Promise.reject(err)
    });
    if (result?.choices?.[0]?.message) {
      const { usage } = result
      const { message } = result.choices[0]
      messages.push({
        ...message,
        ...usage,
        _id: v4(),
        created_at: new Date().toISOString()
      })
    }
    save()
    res.json(messages)
  
  })
  
  router.get('/openai/rooms', async (req, res) => {
    res.json(Object.keys(openaiconf?.chat || {}))
  })
  
  router.post('/openai/rooms', async (req, res) => {
    const { room } = req.body
    if (!openaiconf?.chat?.[room]) {
      if (!openaiconf?.chat) openaiconf.chat = {}
      if (!openaiconf?.chat?.[room]) openaiconf.chat[room] = {}
    }
    save()
    res.json(Object.keys(openaiconf?.chat || {}))
  })
  
  router.delete('/openai/rooms/:room', async (req, res) => {
    const { room } = req.params
    if (openaiconf?.chat?.[room]) delete openaiconf.chat[room]
    save()
    res.json(Object.keys(openaiconf?.chat || {}))
  })
  
  router.get('/openai/chat/:room', async (req, res) => {
    res.json(openaiconf?.chat?.[req.params.room]?.messages)
  })
  
  router.post('/openai/apikey', async (req, res) => {
    const {apikey} = req.body
    openaiconf.apikey = apikey
    save()
    openai = openaiconf.apikey ? new OpenAIApi({
      apiKey: openaiconf.apikey,
    }) : null;
  
    res.json(true)
  })
  
  router.get('/openai/ready', async (req, res) => {
    res.json(!!openaiconf?.apikey)
  })
  
  function save() {
    fse.writeJsonSync(openaiConfPath, openaiconf)
  }
  return router
}
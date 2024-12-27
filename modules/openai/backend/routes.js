const express = require('express');
const pathfs = require('path');
const OpenAIApi = require('openai').OpenAI;
const {
  existsSync, mkdirSync, createReadStream,
  writeFileSync,
  readFileSync,
} = require('fs');
const { encode } = require('gpt-3-encoder');
const { v4 } = require('uuid');
const { writeFile, unlink } = require('fs/promises');
const homedir = require('os').homedir();
const axios = require('axios').default;
const PromiseB = require('bluebird');
const ports = require('../../../servers/server/models/ports');

const router = express.Router();
const confDir = pathfs.resolve(homedir, '.stack-monitor');

if (!existsSync(confDir)) mkdirSync(confDir);
const openaiConfPath = pathfs.resolve(confDir, 'openaiconf.json');
if (!existsSync(openaiConfPath)) writeFileSync(openaiConfPath, '{}', 'utf-8');
const openaiStoragePath = pathfs.resolve(confDir, 'storage');
if (!existsSync(openaiStoragePath)) mkdirSync(openaiStoragePath);
const openaiconf = JSON.parse(readFileSync(openaiConfPath, 'utf-8'));
/** @type {OpenAIApi | null} */
let openai = process.env.STACK_MONITOR_OPENAI_APIKEY ? new OpenAIApi({
  apiKey: process.env.STACK_MONITOR_OPENAI_APIKEY,
}) : null;

module.exports = () => {
  router.get('/openai', async (req, res) => {
    res.json('hello');
  });
  router.get('/openai/image/:id', async (req, res) => {
    res.setHeader('content-type', 'image/png');
    res.setHeader('content-disposition', 'filename=image.png');
    const path = pathfs.resolve(openaiStoragePath, `${req.params.id}.png`);
    if (existsSync(path)) createReadStream(path).pipe(res);
    else res.status(404).send('file not found');
  });
  router.get('/openai/models', async (req, res) => {
    if (!openai) return res.status(400).send('Openai not initialized');
    const models = await openai.models.list({});
    return res.json(models.data);
  });

  router.post('/openai/tokenize', async (req, res) => {
    const encoded = encode(req.body.data);
    res.json({
      nbTokens: encoded.length,
      price: (encoded.length * 0.002) / 1000,
    });
  });

  router.post('/openai/review', async (req, res) => {
    if (!openai) return res.status(400).send('Openai not initialized');
    const result = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0,
      n: 1,
      max_tokens: Infinity,
      messages: [
        { role: 'system', content: 'You are a developer for 10 years. You are expert in git and you should write a commit. I gave you a git diff after. Write me a resume of this diff and write me a commit for this diff in this format: "<fix|feat|major>: <your message not exceeding 60 characters>"' },
        { role: 'assistant', content: req.body.data },
      ],
    }).catch((err) => {
      console.error(err.response.data);
      return Promise.reject(err);
    });
    return res.json(result.choices[0]?.message?.content || 'Cannot respond');
  });

  router.post('/openai/error', async (req, res) => {
    if (!openai) return res.status(400).send('Openai not initialized');
    const result = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0,
      n: 1,
      max_tokens: Infinity,
      messages: [
        { role: 'system', content: 'You are a developer for 20 years. You are expert in it and you should find a solution to this following error. Resume the following error and try to fix it' },
        { role: 'assistant', content: req.body.data },
      ],
    }).catch((err) => {
      console.error(err.response.data);
      return Promise.reject(err);
    });
    return res.json(result.choices[0]?.message?.content || 'Cannot respond');
  });

  router.post('/openai/chat/:room/image', async (req, res) => {
    if (!openai) return res.status(400).send('Openai not initialized');
    const { message, quality, resolution } = req.body;
    if (!openaiconf?.chat) openaiconf.chat = {};
    if (!openaiconf?.chat?.[req.params.room]) openaiconf.chat[req.params.room] = {};
    if (!openaiconf?.chat?.[req.params.room]?.messages) {
      openaiconf.chat[req.params.room].messages = [
        { role: 'system', content: 'Tu es un assistant utile.' },
      ];
    }
    /** @type {import('./index').OpenAiChat[]} */
    const messages = openaiconf?.chat[req.params.room]?.messages || [];
    messages.push({
      _id: v4(),
      // @ts-ignore
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    });
    const response = await openai.images.generate({
      quality,
      model: 'dall-e-3',
      prompt: message,
      n: 1,
      size: resolution,
    });

    if (response?.data?.[0]?.url) {
      const { url, revised_prompt } = response.data[0];
      const uuid = v4();
      const { data: fileBuffer } = await axios.get(url, {
        responseType: 'arraybuffer',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      await writeFile(pathfs.resolve(openaiStoragePath, `${uuid}.png`), fileBuffer);

      messages.push({
        url: `http://localhost:${ports.http}/openai/image/${uuid}`,
        contentId: uuid,
        revised_prompt,
        _id: v4(),
        created_at: new Date().toISOString(),
      });
      save();
    }
    return res.json(response.data[0].url);
  });

  router.post('/openai/chat/:room', async (req, res) => {
    if (!openai) return res.status(400).send('Openai not initialized');
    const { message, model, temperature } = req.body;
    if (!openaiconf?.chat) openaiconf.chat = {};
    if (!openaiconf?.chat?.[req.params.room]) openaiconf.chat[req.params.room] = {};
    if (!openaiconf?.chat?.[req.params.room]?.messages) {
      openaiconf.chat[req.params.room].messages = [
        { role: 'system', content: 'Tu es un assistant utile.' },
      ];
    }
    /** @type {import('./index').OpenAiChat[]} */
    const messages = openaiconf?.chat[req.params.room]?.messages || [];
    messages.push({
      _id: v4(),
      // @ts-ignore
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    });
    const result = await openai.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      temperature: Number.isNaN(+temperature) ? 0 : +temperature,
      n: 1,
      max_tokens: Infinity,
      // @ts-ignore
      messages: messages
        .filter((f) => f?.content)
        .map((a) => ({ role: a.role || 'user', content: a.content || '' }))
        .slice(-15),
    }).catch((err) => Promise.reject(err));
    if (result?.choices?.[0]?.message) {
      const { usage } = result;
      const { message } = result.choices[0];
      messages.push({
        ...message,
        ...usage,
        _id: v4(),
        created_at: new Date().toISOString(),
      });
    }
    save();
    return res.json(messages);
  });

  router.get('/openai/rooms', async (req, res) => {
    res.json(Object.keys(openaiconf?.chat || {}));
  });

  router.post('/openai/rooms', async (req, res) => {
    const { room } = req.body;
    if (!openaiconf?.chat?.[room]) {
      if (!openaiconf?.chat) openaiconf.chat = {};
      if (!openaiconf?.chat?.[room]) openaiconf.chat[room] = {};
    }
    save();
    res.json(Object.keys(openaiconf?.chat || {}));
  });

  router.delete('/openai/rooms/:room', async (req, res) => {
    const { room } = req.params;
    if (openaiconf?.chat?.[room]) {
      await PromiseB.map(openaiconf?.chat?.[room].messages, async (message) => {
        if (message.contentId && existsSync(pathfs.resolve(openaiStoragePath, `${message.contentId}.png`))) {
          await unlink(pathfs.resolve(openaiStoragePath, `${message.contentId}.png`));
        }
      }, { concurrency: 4 });
      delete openaiconf.chat[room];
    }
    save();
    res.json(Object.keys(openaiconf?.chat || {}));
  });

  router.get('/openai/chat/:room', async (req, res) => {
    res.json(openaiconf?.chat?.[req.params.room]?.messages);
  });

  router.post('/openai/apikey', async (req, res) => {
    const { apikey } = req.body;
    process.env.STACK_MONITOR_OPENAI_APIKEY = apikey;
    save();
    openai = process.env.STACK_MONITOR_OPENAI_APIKEY ? new OpenAIApi({
      apiKey: process.env.STACK_MONITOR_OPENAI_APIKEY,
    }) : null;

    res.json(true);
  });

  router.get('/openai/ready', async (req, res) => {
    if (!openai) return res.json(false);
    try {
      await openai.models.list({});
      res.json(!!openaiconf?.apikey);
    } catch (error) {
      res.json(false);
    }
    return undefined;
  });

  function save() {
    writeFileSync(openaiConfPath, JSON.stringify(openaiconf), 'utf-8');
  }
  return router;
};

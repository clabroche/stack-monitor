import Socket from './helpers/Socket';

;(async () => {
  console.log('Init Socket...')
  await Socket.init()

  const { createApp } = await import('vue');
  const {default: App} = await import('./App.vue')
  const {default: router} = await import('./router/router')
  const {default: system} = await import('./models/system')
  const {default: views} = await import('../modules/views')
  const {default: Editor} = await import('./components/Editor.vue')
  const {default: Markdown} = await import('vue3-markdown-it')
  
  system.getVersion()

  const app = createApp(App)
    .component('Editor', Editor)
    .use(Markdown)
    .use(router)
  views.forEach(cmp => app.component(cmp.name, cmp.cmp));
  app.mount('#app')
})()

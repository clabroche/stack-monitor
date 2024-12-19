import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Socket from './helpers/Socket';

(async () => {
  console.log('Init Socket...');
  await Socket.init('/socket');

  const { default: router } = await import('./router/router');
  const { createApp } = await import('vue');
  const { default: App } = await import('./App.vue');
  const { default: system } = await import('./models/system');
  const { default: views } = await import('@clabroche/modules-plugins-loader-front/src/views');
  const { default: Editor } = await import('./components/Editor.vue');
  const { default: Section } = await import('./components/Section.vue');
  const { default: Markdown } = await import('./components/Markdown.vue');

  system.getVersion().catch((err) => {
    console.error(err);
  });

  const app = createApp(App)
    .component('Editor', Editor)
    .component('SectionCmp', Section)
    .use(Markdown)
    .use(PrimeVue, {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.theme-dark',
        },
      },
    })
    .use(router);
  views.forEach((cmp) => app.component(cmp.name, cmp.cmp));
  app.mount('#app');
})();

import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import { createApp } from 'vue';
import App from './App.vue'
import router from './router/router'
import system from './models/system'
import views from '../modules/views'
system.getVersion()

const app = createApp(App)
  .use(VueMonacoEditorPlugin)
  .use(router)

views.forEach(cmp => app.component(cmp.name, cmp.cmp));

app
  .mount('#app')

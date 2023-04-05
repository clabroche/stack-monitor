import { createApp } from 'vue';
import App from './App.vue'
import router from './router/router'
import system from './models/system'
import views from '../modules/views'
import Editor from './components/Editor.vue'
import Markdown from 'vue3-markdown-it';
import 'highlight.js/styles/monokai.css';

system.getVersion()

const app = createApp(App)
  .component('Editor', Editor)
  .use(Markdown)
  .use(router)

views.forEach(cmp => app.component(cmp.name, cmp.cmp));

app
  .mount('#app')

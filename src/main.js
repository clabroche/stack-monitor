import { createApp } from 'vue';
import App from './App.vue'
import router from './router/router'
import system from './models/system'
system.getVersion()

createApp(App)
  .use(router)
  .mount('#app')

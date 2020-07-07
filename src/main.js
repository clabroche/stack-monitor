import Vue from 'vue'
import App from './App.vue'
import router from './router'
import system from './models/system'
import VueScrollStop from 'vue-scroll-stop'
import VModal from 'vue-js-modal'

system.getVersion()
Vue.config.productionTip = false

Vue.use(VModal)
Vue.use(VueScrollStop)


new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

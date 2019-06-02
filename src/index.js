import Vue from 'blessed-vue'
import Main from './Main.vue'
import colors from 'colors'
const el = Vue.dom.createElement()

Vue.dom.append(el)

const instance = new Vue({
  name: 'app',
  components: {
    'main': Main
  },
  template: '<main />'
}).$mount(el)

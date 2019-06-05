import Vue from 'blessed-vue'
import Main from './cli/Main.vue'
import colors from 'colors'

if(process.argv[3] === '--gui') {
  launchView()
} else {
  launchCli()
}


function launchCli() {
  const el = Vue.dom.createElement()
  Vue.dom.append(el)
  new Vue({
    name: 'app',
    components: {
      'main': Main
    },
    template: '<main />'
  }).$mount(el)
}

function launchView() {

}
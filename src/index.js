import VueBlessed from 'blessed-vue'
import MainCli from './cli/Main.vue'
import colors from 'colors'
if(process.argv.includes('--gui')) {
  launchView()
} else {
  launchCli()
}


function launchCli() {
  const el = VueBlessed.dom.createElement()
  VueBlessed.dom.append(el)
  new VueBlessed({
    name: 'app',
    components: {
      'main': MainCli
    },
    template: '<main />'
  }).$mount(el)
}

async function launchView() {
  require('./gui/server/bin/www')
}
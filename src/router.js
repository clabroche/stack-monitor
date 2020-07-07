import Vue from 'vue'
import Router from 'vue-router'
import StackChooserVue from './views/StackChooser.vue'
import StackSingle from './views/StackSingle.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/stack-chooser',
      name: 'stack-chooser',
      component: StackChooserVue
    },
    {
      path: '/stack-single/:label',
      name: 'stack-single',
      component: StackSingle
    },
  ]
})

import StackChooserVue from '../views/StackChooser.vue'
import StackSingle from '../views/StackSingle.vue'
import StackMultiple from '../views/StackMultiple.vue'
import ImportCreate from '../views/ImportCreate.vue'
import { createRouter, createWebHashHistory } from "vue-router";
import plugins from '../../modules/views'

const pluginsRoutes = plugins.map(p => p.routes).filter(f => f).flat()

const routes = [
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
  {
    path: '/stack-multiple',
    name: 'stack-multiple',
    component: StackMultiple
  }, {
    path: '/import-create',
    name: 'import-create',
    component: ImportCreate
  },
  ...pluginsRoutes,
  {
    name: "not-found",
    path: "/:pathMatch(.*)*",
    redirect: { name: 'stack-chooser' },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  // @ts-ignore
  routes,
});

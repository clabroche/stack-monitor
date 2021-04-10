import StackChooserVue from '../views/StackChooser.vue'
import StackSingle from '../views/StackSingle.vue'
import StackMultiple from '../views/StackMultiple.vue'
import { createRouter, createWebHashHistory } from "vue-router";
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
  },
  {
    name: "not-found",
    path: "/:pathMatch(.*)*",
    redirect: { name: 'stack-chooser' },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});

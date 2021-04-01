import StackChooserVue from '../views/StackChooser.vue'
import StackSingle from '../views/StackSingle.vue'
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
    name: "not-found",
    path: "/:pathMatch(.*)*",
    redirect: { name: 'stack-chooser' },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});

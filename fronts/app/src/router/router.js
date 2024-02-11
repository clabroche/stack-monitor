import { createRouter, createWebHashHistory } from 'vue-router';
import plugins from '@clabroche/modules-plugins-loader-front/src/views';

/**
 * @type {import('vue-router').RouteRecordRaw[]}
 */
// @ts-ignore
const pluginsRoutes = plugins.map((p) => p.routes).filter((f) => f).flat();

/** @type {import('vue-router').RouteRecordRaw[]} */
const routes = [
  {
    path: '/stack-chooser',
    name: 'stack-chooser',
    // @ts-ignore
    component: () => import('../views/StackChooser.vue'),
  },
  {
    path: '/stack-single/:label',
    name: 'stack-single',
    // @ts-ignore
    component: () => import('../views/StackSingle.vue'),
  },
  {
    path: '/stack-multiple',
    name: 'stack-multiple',
    // @ts-ignore
    component: () => import('../views/StackMultiple.vue'),
  }, {
    path: '/import-create',
    name: 'import-create',
    // @ts-ignore
    component: () => import('../views/ImportCreate.vue'),
  },
  ...pluginsRoutes,
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    redirect: { name: 'stack-chooser' },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  // @ts-ignore
  routes,
});

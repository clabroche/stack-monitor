import { createRouter, createWebHashHistory } from 'vue-router';
import plugins from '@clabroche/modules-plugins-loader-front/src/views';
import stack from '../models/stack';

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
    path: '/stack-single',
    name: 'stack-single-no-view',
    // @ts-ignore
    component: () => import('../views/StackSingle.vue'),
  },
  {
    path: '/overview',
    name: 'overview',
    // @ts-ignore
    component: () => import('../views/Overview.vue'),
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
  }, {
    path: '/settings',
    name: 'settings-no-view',
    // @ts-ignore
    component: () => import('../views/Settings.vue'),
    children: [
      {
        path: ':setting',
        name: 'settings',
        // @ts-ignore
        component: () => import('../views/Settings.vue'),
      },
    ],
  }, {
    path: '/init',
    name: 'init',
    // @ts-ignore
    component: () => import('../views/Init.vue'),
  },
  ...pluginsRoutes,
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    redirect: { name: 'stack-chooser' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  // @ts-ignore
  routes,

});
router.beforeEach(async (to, from) => {
  if (to.name !== 'settings' || to.params.setting !== 'crypto') {
    const shouldSetup = await stack.shouldSetup();
    if (shouldSetup) return { name: 'settings', params: { setting: 'crypto' }, query: { wrongKey: 'true' } };
  }
});

export default router;

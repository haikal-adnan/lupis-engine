// @ts-nocheck
import { createRouter, createWebHistory } from 'vue-router'

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ 
  showSpinner: false, 
  easing: 'ease', 
  speed: 500,
  trickleSpeed: 200 
});

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/layouts/AboutPage.vue'), 
    meta: { layout: 'MainLayout' } 
  },
  {
    path: '/docs',
    redirect: '/docs/getting_started/introduction'
  },
  {
    path: '/docs/:docPath(.*)*',
    name: 'Docs',
    component: () => import('@/features/docs/layouts/DocsPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/features/settings/workspaces/layouts/SettingsPage.vue'), 
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/features/dashboards/layouts/DashboardPage.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/editor/:idProject', 
    name: 'Editor',
    component: () => import('@/layouts/EditorView.vue'),   
    props: true, 
    meta: { layout: 'EditorLayout' }
  },
  {
    path: '/test-opfs',
    name: 'OPFSTest',
    component: () => import('@/features/opfs/layouts/OPFSPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('@/features/explores/layouts/ExplorePanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/play/:id',
    name: 'DetailPanel',
    component: () => import('@/features/explores/layouts/DetailPanel.vue'),
    props: true,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from) => { 
  NProgress.start();
  return true; 
});

router.afterEach(() => {
  NProgress.done();
});

router.onError(() => {
  NProgress.done();
});

export default router
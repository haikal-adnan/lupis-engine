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
    path: '/docs',
    redirect: () => {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('lupis_docs_lang') : null;
      const lang = saved === 'id' ? 'id' : 'en';
      return `/docs/${lang}/getting_started/introduction`;
    }
  },
  {
    path: '/docs/:lang(id|en)',
    redirect: to => `/docs/${to.params.lang}/getting_started/introduction`
  },
  {
    path: '/docs/:lang(id|en)/:docPath(.*)*',
    name: 'Docs',
    component: () => import('@/features/docs/layouts/DocsPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/docs/:docPath(.*)*',
    redirect: to => {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('lupis_docs_lang') : null;
      const lang = saved === 'id' ? 'id' : 'en';
      const path = to.params.docPath
        ? (Array.isArray(to.params.docPath) ? to.params.docPath.join('/') : to.params.docPath)
        : 'getting_started/introduction';
      return `/docs/${lang}/${path}`;
    }
  },
  {
    path: '/settings',
    redirect: '/dashboard'
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

router.beforeEach(async (to, from) => { 
  NProgress.start();

  const isLeavingCurrentProject = (from.name === 'Editor' || Boolean(from.path && from.path.startsWith('/editor'))) &&
                                  (to.name !== 'Editor' || to.params?.idProject !== from.params?.idProject);

  if (isLeavingCurrentProject) {
    try {
      const { useProjectStore } = await import('@projects/useProjectStore.js');
      const projectStore = useProjectStore();

      if (projectStore && projectStore.isDirty) {
        const { useConfirm } = await import('@composables/composables.js');
        const { confirm } = useConfirm();

        const isConfirmed = await confirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave the editor? Unsaved changes will be lost.',
          type: 'danger',
          confirmText: 'Leave Without Saving'
        });

        if (!isConfirmed) {
          NProgress.done();
          return false;
        }

        projectStore.clearProjectData();
      }
    } catch (e) {
      console.warn('[Router Guard] Warning verifying dirty status:', e);
    }
  }

  return true; 
});

router.afterEach(() => {
  NProgress.done();
});

router.onError(() => {
  NProgress.done();
});

export default router
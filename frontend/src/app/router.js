// @ts-nocheck
import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 
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
    name: 'Landing',
    component: LandingPage,
    meta: { layout: 'LandingLayout' } 
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage,
    meta: { layout: 'LandingLayout' } 
  },
  // --- BAGIAN YANG DIPERBARUI ---
  {
    path: '/docs',
    redirect: '/docs/getting_started/introduction' // Redirect ke halaman default jika user hanya mengunjungi /docs
  },
  {
    path: '/docs/:docPath(.*)*', // Menangkap semua path yang memiliki "/" setelah /docs/
    name: 'Docs',
    component: () => import('@/modules/docs/DocsPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  // -----------------------------
  {
    path: '/profile/:usernameUser', 
    name: 'Profile',
    component: () => import('@/modules/profile/views/ProfilePanel.vue'),
    meta: { layout: 'MainLayout' } 
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/modules/setting/SettingsPage.vue'), 
    meta: { layout: 'MainLayout', requiresAuth: true }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('@/modules/explore/views/ExplorePanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/play/:slug',
    name: 'GameDetail',
    component: () => import('@/modules/detail/views/DetailPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/verify-otp',
    name: 'VerifyOTP',
    component: () => import('@/modules/auth/views/VerifyOtpPage.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/modules/dashboards/views/DashboardPage.vue'),
    meta: { layout: 'MainLayout', requiresAuth: true }
  },
  {
    path: '/publish/:idProject',
    name: 'PublishGame',
    component: () => import('@/modules/publish/views/PublishGamePage.vue'),
    meta: { layout: 'MainLayout', requiresAuth: true },
    props: true
  },
  {
    path: '/editor/:idProject', 
    name: 'Editor',
    component: () => import('@/layouts/EditorView.vue'),   
    props: true, 
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
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

  const isAuthenticated = !!localStorage.getItem('lupis_auth_token');

  if (isAuthenticated && to.name === 'Landing' && !from.name) {
    return { name: 'Dashboard' }; 
  }
  // -----------------------------

  if (to.meta.requiresAuth && !isAuthenticated) {
    NProgress.done(); 
    return { 
      name: 'Landing', 
      query: { action: 'login', redirect: to.fullPath } 
    };
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
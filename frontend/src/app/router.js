import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 

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
  {
    path: '/docs',
    name: 'Docs',
    component: () => import('@/modules/docs/DocsPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/profile/:usernameUser', 
    name: 'Profile',
    component: () => import('@/modules/profile/views/ProfilePanel.vue'),
    meta: { layout: 'MainLayout' } 
  },
  // --- TAMBAH ROUTE SETTINGS DI SINI ---
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/modules/setting/SettingsPage.vue'), // Sesuaikan path ini
    meta: { layout: 'MainLayout', requiresAuth: true }
  },
  // -------------------------------------
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
  document.body.classList.add('is-loading');

  const isAuthenticated = !!localStorage.getItem('lupis_auth_token');

  if (isAuthenticated && to.name === 'Landing') {
    return { name: 'Dashboard' };
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    document.body.classList.remove('is-loading'); 
    return { 
      name: 'Landing', 
      query: { action: 'login', redirect: to.fullPath } 
    };
  }
  
  return true; 
});

router.afterEach(() => {
  document.body.classList.remove('is-loading');
});

router.onError(() => {
  document.body.classList.remove('is-loading');
});

export default router
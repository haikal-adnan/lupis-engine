import { createRouter, createWebHistory } from 'vue-router'

// ==========================================
// 1. INSTANT LOAD (Synchronous Imports)
// Dimuat di awal, cocok untuk halaman utama
// ==========================================
import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 

const routes = [
  // --- INSTANT LOAD ROUTES ---
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

  // ==========================================
  // 2. LAZY LOAD (Asynchronous Imports)
  // Dimuat hanya ketika user mengunjungi URL ini
  // ==========================================
  {
    path: '/docs',
    name: 'Docs',
    component: () => import('@/modules/docs/DocsPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/modules/profile/views/ProfilePanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/catalog',
    name: 'Catalog Games',
    component: () => import('@/modules/catalog/views/CatalogPanel.vue'),
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/detail',
    name: 'Detail Games',
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
    path: '/editor/:idProject', 
    name: 'Editor',
    component: () => import('@/layouts/EditorView.vue'),   
    props: true, 
    meta: { requiresAuth: true }
  },
  
  // Fallback Route
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from) => {
  const isAuthenticated = !!localStorage.getItem('lupis_auth_token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { 
      name: 'Landing', 
      query: { action: 'login', redirect: to.fullPath } 
    };
  }
  
  return true; 
});

export default router
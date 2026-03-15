import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/layouts/EditorView.vue'
import DashboardPage from '@/modules/dashboards/views/DashboardPage.vue'
import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 
import DocsPanel from '@/modules/docs/DocsPanel.vue'
import ProfilePanel from '@/modules/profile/views/ProfilePanel.vue'
import CatalogPanel from '@/modules/catalog/views/CatalogPanel.vue'
import DetailPanel from '@/modules/detail/views/DetailPanel.vue'
import VerifyOtpPage from '@/modules/auth/views/VerifyOtpPage.vue'

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
    component: DocsPanel,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePanel,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/catalog',
    name: 'Catalog Games',
    component: CatalogPanel,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/detail',
    name: 'Detail Games',
    component: DetailPanel,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/verify-otp',
    name: 'VerifyOTP',
    component: VerifyOtpPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { layout: 'MainLayout', requiresAuth: true }
  },

  {
    path: '/editor/:idProject', 
    name: 'Editor',
    component: EditorView,   
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
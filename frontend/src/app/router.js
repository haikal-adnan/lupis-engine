import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/layouts/EditorView.vue'
import DashboardPage from '@/modules/dashboards/views/DashboardPage.vue'
import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 
import DocsPanel from '@/modules/docs/DocsPanel.vue'
import ProfilePanel from '@/modules/profile/views/ProfilePanel.vue'
import CatalogPanel from '@/modules/catalog/views/CatalogPanel.vue'
import DetailPanel from '@/modules/detail/views/DetailPanel.vue'

const routes = [
  // --- LANDING LAYOUT ---
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

  // --- MAIN LAYOUT ---
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

  // --- DASHBOARD LAYOUT ---
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { layout: 'MainLayout' }
  },

  // --- EDITOR LAYOUT ---
  {
    path: '/editor/:idProject', 
    name: 'Editor',
    component: EditorView,   
    props: true, 
  },

  // --- FALLBACK ---
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

export default router
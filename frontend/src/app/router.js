import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/layouts/EditorView.vue'
import DashboardPage from '@/modules/dashboards/views/DashboardPage.vue'
import LandingPage from '@/modules/landing/views/LandingPage.vue'
import AboutPage from '@/modules/landing/views/AboutPage.vue' 
import DocsPanel from '@/modules/docs/DocsPanel.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { layout: 'EmptyLayout' } 
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage,
    meta: { layout: 'AboutLayout' } 
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { layout: 'DashboardLayout' }
  },
    {
    path: '/docs',
    name: 'Docs',
    component: DocsPanel,
    meta: { layout: 'DocsLayout' }
  },
  {
    path: '/editor/:idProject', 
    name: 'Editor',
    component: EditorView,   
    props: true, 
    meta: { layout: 'EditorLayout' }
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

export default router
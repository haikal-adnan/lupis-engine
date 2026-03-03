import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/layouts/EditorView.vue'
import DashboardPage from '@/modules/dashboards/views/DashboardPage.vue'
import LandingPage from '@/modules/landing/views/LandingPage.vue' 

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { layout: 'EmptyLayout' } 
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { layout: 'DashboardLayout' }
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
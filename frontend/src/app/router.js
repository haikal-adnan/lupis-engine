import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/layouts/EditorView.vue'
import DashboardPage from '@/modules/dashboards/views/DashboardPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
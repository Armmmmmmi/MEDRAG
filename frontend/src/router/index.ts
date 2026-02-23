import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/single' },
    { path: '/single', component: () => import('../views/SingleCheckView.vue') },
    { path: '/multi', component: () => import('../views/MultiCheckView.vue') },
    { path: '/patient', component: () => import('../views/PatientView.vue') },
    { path: '/qa', component: () => import('../views/QAView.vue') },
    { path: '/admin', component: () => import('../views/AdminView.vue') },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/auth'

const routes = [
    { path: '/', redirect: '/single' },
    { path: '/single', component: () => import('../views/SingleCheckView.vue') },
    { path: '/multi', component: () => import('../views/MultiCheckView.vue') },
    { path: '/patient', component: () => import('../views/PatientView.vue') },
    { path: '/qa', component: () => import('../views/QAView.vue') },
    { path: '/history', component: () => import('../views/HistoryView.vue') },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    {
        path: '/admin',
        component: () => import('../views/AdminView.vue'),
        meta: { requiresAuth: true }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!authService.isAuthenticated()) {
            next({ path: '/login' })
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router

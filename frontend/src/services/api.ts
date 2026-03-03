import axios from 'axios';
import { authService } from './auth';
import router from '../router';

const api = axios.create({
    baseURL: '/api', // Proxied to localhost:3000 by Vite
    timeout: 60000,   // High timeout for LLM generation responses
});

api.interceptors.request.use((config) => {
    const token = authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authService.logout();
            router.push('/login');
        }
        return Promise.reject(error);
    }
);

export default api;

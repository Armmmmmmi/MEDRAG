import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxied to localhost:3000 by Vite
    timeout: 60000,   // High timeout for LLM generation responses
});

export default api;

import axios from 'axios';
import config from '../config/api';
import { useAuthStore } from '../stores/authStore';

// Create axios instance
const api = axios.create({
    baseURL: config.API_URL,
    timeout: config.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',  // Requis pour localtunnel
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (reqConfig) => {
        const token = useAuthStore.getState().token;
        if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;

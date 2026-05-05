import { useMemo } from 'react'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
})

// Intercepteur pour ajouter le token automatiquement
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Intercepteur de réponse — déconnexion automatique sur 401
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && useAuthStore.getState().isAuthenticated) {
            console.warn('API 401 — Token expiré ou invalide, déconnexion')
            useAuthStore.getState().logout()
        }
        return Promise.reject(error)
    }
)

export function useApi() {
    return useMemo(() => ({
        get: (endpoint) => apiClient.get(endpoint).then((r) => r.data),
        post: (endpoint, data) => apiClient.post(endpoint, data).then((r) => r.data),
        put: (endpoint, data) => apiClient.put(endpoint, data).then((r) => r.data),
        patch: (endpoint, data) => apiClient.patch(endpoint, data).then((r) => r.data),
        delete: (endpoint) => apiClient.delete(endpoint).then((r) => r.data)
    }), [])
}

export default apiClient

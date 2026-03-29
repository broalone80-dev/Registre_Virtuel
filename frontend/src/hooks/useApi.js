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

// Intercepteur de réponse — NE PAS rediriger sur 401 pendant le chargement initial
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Seulement déconnecter si c'est un 401 ET que l'utilisateur était authentifié
        if (error.response?.status === 401 && useAuthStore.getState().isAuthenticated) {
            // Ne pas rediriger — laisser le catch des pages gérer le fallback
            console.warn('API 401 — Token expiré ou invalide')
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

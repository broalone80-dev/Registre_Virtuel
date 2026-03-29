import { create } from 'zustand'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export const useAuthStore = create((set, get) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,

    // === Role helpers ===
    isAdmin: () => {
        const role = get().user?.role
        return role === 'super_admin' || role === 'admin'
    },

    isTechnician: () => {
        const role = get().user?.role
        return role === 'technician'
    },

    isManager: () => {
        const role = get().user?.role
        return role === 'manager'
    },

    isAgent: () => {
        const role = get().user?.role
        return role === 'receptionist'
    },

    // Checks if user has at least one of the given roles
    hasRole: (...roles) => {
        const userRole = get().user?.role
        return roles.includes(userRole)
    },

    getUserName: () => {
        const user = get().user
        return user ? `${user.first_name} ${user.last_name}` : ''
    },

    getFirstName: () => {
        return get().user?.first_name || 'Utilisateur'
    },

    getUserAgencyId: () => {
        return get().user?.agency_id || null
    },

    // === Actions ===
    login: async (email, password) => {
        set({ loading: true, error: null })
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
            const { token, user } = res.data.data

            set({
                token,
                user,
                isAuthenticated: true,
                loading: false,
                error: null
            })

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {
            const message = e.response?.data?.message || 'Erreur de connexion'
            set({ error: message, isAuthenticated: false, loading: false })
            throw e
        }
    },

    register: async (userData) => {
        set({ loading: true, error: null })
        try {
            const res = await axios.post(`${API_BASE}/auth/register`, userData)
            const { token, user } = res.data.data

            set({
                token,
                user,
                isAuthenticated: true,
                loading: false,
                error: null
            })

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {
            const message = e.response?.data?.message || 'Erreur lors de l\'inscription'
            set({ error: message, loading: false })
            throw e
        }
    },

    logout: () => {
        set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null
        })
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    },

    restoreSession: () => {
        try {
            const token = localStorage.getItem('token')
            const userStr = localStorage.getItem('user')

            if (token && userStr) {
                set({
                    token,
                    user: JSON.parse(userStr),
                    isAuthenticated: true
                })
            }
        } catch {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
    }
}))

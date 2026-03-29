import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,

    // Initialiser depuis le stockage sécurisé
    initialize: async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userData = await SecureStore.getItemAsync('auth_user');
            if (token && userData) {
                set({
                    token,
                    user: JSON.parse(userData),
                    isAuthenticated: true,
                    loading: false,
                });
            } else {
                set({ loading: false });
            }
        } catch (err) {
            console.error('Auth init error:', err);
            set({ loading: false });
        }
    },

    // Connexion
    login: async (token, user) => {
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true, loading: false });
    },

    // Déconnexion
    logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('auth_user');
        set({ token: null, user: null, isAuthenticated: false });
    },

    // Helpers de rôle
    isAdmin: () => ['admin', 'super_admin'].includes(get().user?.role),
    isTechnician: () => get().user?.role === 'technician',
    isAgent: () => get().user?.role === 'agent',
    isManager: () => get().user?.role === 'manager',
}));

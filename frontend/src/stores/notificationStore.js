import { create } from 'zustand'

export const useNotificationStore = create(
    (set, get) => ({
        notifications: [],
        unreadCount: 0,
        _loaded: false,

        // Load notifications from API (called on login / app init)
        loadNotifications: async (api) => {
            try {
                const res = await api.get('/notifications?limit=50')
                const notifications = Array.isArray(res?.data) ? res.data : (res?.data?.data || [])
                const unread = notifications.filter(n => !n.is_read).length
                set({ notifications, unreadCount: unread, _loaded: true })
            } catch (err) {
                console.error('Error loading notifications:', err)
            }
        },

        setNotifications: (data) => {
            const notifications = Array.isArray(data) ? data : (data?.data || [])
            const unread = notifications.filter(n => !n.is_read).length
            set({ notifications, unreadCount: unread })
        },

        addNotification: (notification) => {
            set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1
            }))
        },

        // Mark single notification as read — persists to DB
        markAsRead: async (id, api) => {
            // Optimistic local update
            set((state) => {
                const notif = state.notifications.find(n => n.id === id)
                if (!notif || notif.is_read) return state
                return {
                    notifications: state.notifications.map(n =>
                        n.id === id ? { ...n, is_read: true } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1)
                }
            })
            // Persist to backend
            if (api) {
                try {
                    await api.patch(`/notifications/${id}/read`)
                } catch (err) {
                    console.error('Error marking notification as read:', err)
                }
            }
        },

        // Mark all as read — persists to DB
        markAllAsRead: async (api) => {
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            }))
            if (api) {
                try {
                    await api.patch('/notifications/read-all')
                } catch (err) {
                    console.error('Error marking all as read:', err)
                }
            }
        },

        clearAll: () => set({ notifications: [], unreadCount: 0, _loaded: false })
    })
)

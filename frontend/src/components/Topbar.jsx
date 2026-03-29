import { useState, useEffect } from 'react'
import { HiOutlineBell, HiOutlineMagnifyingGlass, HiOutlineUserCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useSocket } from '../hooks/useSocket'
import { useApi } from '../hooks/useApi'
import NotificationPanel from './NotificationPanel'
import toast from 'react-hot-toast'
import './Topbar.css'

export default function Topbar({ onOpenNotifs }) {
    const user = useAuthStore(s => s.user)
    const { unreadCount, addNotification, loadNotifications } = useNotificationStore()
    const socket = useSocket()
    const api = useApi()

    useEffect(() => {
        if (user) loadNotifications(api)
    }, [user, api, loadNotifications])

    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (notif) => {
                addNotification(notif)
                toast(notif.title, {
                    icon: '🔔',
                    style: {
                        borderRadius: '12px',
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }
                })
            })
            return () => socket.off('new_notification')
        }
    }, [socket, addNotification])

    return (
        <header className="app-topbar">
            <div className="topbar-left">
                <div className="topbar-search">
                    <HiOutlineMagnifyingGlass size={18} />
                    <input type="text" placeholder="Rechercher une référence, un agent..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-btn" title="Aide">
                    <HiOutlineQuestionMarkCircle size={22} />
                </button>

                <button
                    className="topbar-btn"
                    onClick={onOpenNotifs}
                    title="Notifications"
                >
                    <HiOutlineBell size={22} />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                <div className="topbar-divider"></div>

                <div className="topbar-user">
                    <div className="user-details">
                        <span className="user-name">{user?.first_name} {user?.last_name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <div className="user-avatar-small">
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    )
}

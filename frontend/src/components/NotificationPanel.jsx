import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineBell, HiOutlineCheckCircle, HiOutlineXMark,
    HiOutlineCpuChip, HiOutlineWrenchScrewdriver,
    HiOutlineExclamationTriangle, HiOutlineMagnifyingGlass,
    HiOutlineChatBubbleLeftRight, HiOutlineCog6Tooth,
    HiOutlineArchiveBox, HiOutlineCheck
} from 'react-icons/hi2'
import { useNotificationStore } from '../stores/notificationStore'
import { useApi } from '../hooks/useApi'
import './NotificationPanel.css'

const TYPE_CONFIG = {
    equipment: {
        icon: <HiOutlineCpuChip size={18} />,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        label: 'Équipement'
    },
    intervention: {
        icon: <HiOutlineWrenchScrewdriver size={18} />,
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.12)',
        label: 'Intervention'
    },
    alert: {
        icon: <HiOutlineExclamationTriangle size={18} />,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        label: 'Alerte'
    },
    message: {
        icon: <HiOutlineChatBubbleLeftRight size={18} />,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
        label: 'Message'
    },
    system: {
        icon: <HiOutlineCog6Tooth size={18} />,
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.12)',
        label: 'Système'
    }
}

function getRelativeTime(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationPanel({ onClose }) {
    const api = useApi()
    const navigate = useNavigate()
    const panelRef = useRef(null)
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
    const [activeTab, setActiveTab] = useState('unread')

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const handleNotifClick = (notif) => {
        if (!notif.is_read) {
            markAsRead(notif.id, api)
        }
        if (notif.link) {
            navigate(notif.link)
            onClose()
        }
    }

    const handleMarkAllRead = () => {
        markAllAsRead(api)
    }

    const displayedNotifs = activeTab === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications

    const groupedNotifs = displayedNotifs.reduce((groups, notif) => {
        const date = new Date(notif.created_at)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let label
        if (date.toDateString() === today.toDateString()) label = "Aujourd'hui"
        else if (date.toDateString() === yesterday.toDateString()) label = 'Hier'
        else label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

        if (!groups[label]) groups[label] = []
        groups[label].push(notif)
        return groups
    }, {})

    return (
        <AnimatePresence>
            <div className="notification-overlay">
                <motion.div
                    ref={panelRef}
                    className="notification-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                >
                    {/* Header */}
                    <div className="notif-header">
                        <div className="notif-title-group">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="notif-count-badge">{unreadCount}</span>
                            )}
                        </div>
                        <div className="notif-header-actions">
                            {unreadCount > 0 && (
                                <button className="btn-mark-all" onClick={handleMarkAllRead}>
                                    <HiOutlineCheck size={14} />
                                    Tout lire
                                </button>
                            )}
                            <button className="btn-close-panel" onClick={onClose}>
                                <HiOutlineXMark size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="notif-tabs">
                        <button
                            className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unread')}
                        >
                            Non lues
                            {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
                        </button>
                        <button
                            className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Toutes
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="notif-list">
                        {displayedNotifs.length === 0 ? (
                            <div className="notif-empty">
                                <div className="empty-icon-box">
                                    <HiOutlineBell size={36} />
                                </div>
                                <h4>{activeTab === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}</h4>
                                <p>Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.</p>
                            </div>
                        ) : (
                            Object.entries(groupedNotifs).map(([dateLabel, notifs]) => (
                                <div key={dateLabel} className="notif-group">
                                    <div className="notif-group-label">{dateLabel}</div>
                                    {notifs.map((notif) => {
                                        const typeConf = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                                        return (
                                            <motion.div
                                                key={notif.id}
                                                className={`notif-item ${!notif.is_read ? 'unread' : ''} ${notif.link ? 'clickable' : ''}`}
                                                onClick={() => handleNotifClick(notif)}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                whileHover={{ x: -3 }}
                                            >
                                                <div
                                                    className="notif-icon-box"
                                                    style={{ background: typeConf.bg, color: typeConf.color }}
                                                >
                                                    {typeConf.icon}
                                                </div>
                                                <div className="notif-body">
                                                    <div className="notif-title-row">
                                                        <h4>{notif.title}</h4>
                                                        <span className="notif-type-tag" style={{ color: typeConf.color, background: typeConf.bg }}>
                                                            {typeConf.label}
                                                        </span>
                                                    </div>
                                                    <p>{notif.message}</p>
                                                    <span className="notif-time">{getRelativeTime(notif.created_at)}</span>
                                                </div>
                                                {!notif.is_read && <span className="notif-dot" style={{ background: typeConf.color }} />}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

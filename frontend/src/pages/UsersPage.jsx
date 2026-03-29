import { useState, useEffect, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlinePlusCircle, HiOutlineSearch, HiOutlineTrash, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineX, HiOutlineMail } from 'react-icons/hi'
import { HiOutlineWrenchScrewdriver, HiOutlineShieldCheck, HiOutlineChartBar, HiOutlineClipboardDocumentList, HiOutlinePaperAirplane } from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
import './UsersPage.css'

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    technician: 'Maintenancier',
    receptionist: 'Agent'
}

const ROLE_ICONS = {
    super_admin: <HiOutlineShieldCheck size={16} />,
    admin: <HiOutlineLockClosed size={16} />,
    manager: <HiOutlineChartBar size={16} />,
    technician: <HiOutlineWrenchScrewdriver size={16} />,
    receptionist: <HiOutlineClipboardDocumentList size={16} />
}

export default function UsersPage() {
    const api = useApi()
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'
    const [users, setUsers] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(null)
    const [showNotifyModal, setShowNotifyModal] = useState(null)
    const [notifyData, setNotifyData] = useState({ subject: '', message: '' })
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'receptionist', phone: ''
    })

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/users')
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    setUsers(res.data)
                }
            } catch {
                console.log('Users: API indisponible, données de démo')
            }
        }
        load()
    }, [])

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchSearch = !searchQuery ||
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchRole = !selectedRole || u.role === selectedRole
            return matchSearch && matchRole
        })
    }, [users, searchQuery, selectedRole])

    const toggleActive = async (userId) => {
        const targetUser = users.find(u => u.id === userId)
        if (!targetUser) return
        try {
            await api.patch(`/users/${userId}/status`, { is_active: !targetUser.is_active })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u))
            toast.success(targetUser.is_active ? 'Compte désactivé' : 'Compte activé')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la modification')
        }
    }

    const deleteUser = async (userId) => {
        try {
            await api.delete(`/users/${userId}`)
            setUsers(prev => prev.filter(u => u.id !== userId))
            setShowDeleteModal(null)
            toast.success('Utilisateur supprimé avec succès')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
        }
    }

    const sendNotification = async () => {
        if (!showNotifyModal || !notifyData.subject || !notifyData.message) {
            toast.error('Veuillez remplir le sujet et le message')
            return
        }
        try {
            const res = await api.post('/notifications/send', {
                user_id: showNotifyModal.id,
                subject: notifyData.subject,
                message: notifyData.message
            })
            if (res?.success !== false) {
                toast.success(`Notification envoyée à ${showNotifyModal.email}`)
            } else {
                toast.error('Erreur lors de l\'envoi')
            }
        } catch {
            toast.error('Erreur lors de l\'envoi de la notification')
        }
        setShowNotifyModal(null)
        setNotifyData({ subject: '', message: '' })
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            const res = await api.post('/auth/register', formData)
            if (res?.data) {
                setUsers(prev => [{ ...res.data, agency: { name: 'N/A' } }, ...prev])
                setShowModal(false)
                toast.success('Utilisateur créé avec succès')
                return
            }
        } catch { /* fallback */ }
        const newId = users.length > 0 ? Math.max(...users.map(u => typeof u.id === 'number' ? u.id : 0)) + 1 : 1
        setUsers(prev => [{
            id: newId, ...formData, is_active: true,
            agency: { name: 'N/A' }, created_at: new Date().toISOString()
        }, ...prev])
        setShowModal(false)
        toast.success('Utilisateur créé (mode démo)')
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter(u => u.is_active).length,
        technicians: users.filter(u => u.role === 'technician').length,
        agents: users.filter(u => u.role === 'receptionist').length
    }), [users])

    return (
        <motion.div
            className="users-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' }
            }} />

            {/* Top Bar with Breadcrumbs */}
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Administration</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Utilisateurs</span>
                </div>
                <div className="topbar-actions">
                    <button onClick={() => { setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'receptionist', phone: '' }); setShowModal(true) }} className="topbar-btn-add">
                        <HiOutlinePlusCircle size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        <span>Nouvel utilisateur</span>
                    </button>
                </div>
            </div>

            {/* Title Section */}
            <motion.div
                className="dashboard-title-section"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
            >
                <h1 className="dashboard-title"><HiOutlineUserGroup size={28} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Gestion des Comptes</h1>
                <p className="dashboard-subtitle">
                    Administration du personnel et des accès — {stats.active} comptes actifs
                </p>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                className="dash-stats-row"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineUserGroup size={22} /></div>
                        <div className="dash-stat-badge stable">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Utilisateurs</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">ACTIFS</div>
                    </div>
                    <p className="dash-stat-label">Comptes validés</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.active}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineWrenchScrewdriver size={22} /></div>
                        <div className="dash-stat-badge action">SPECIAL</div>
                    </div>
                    <p className="dash-stat-label">Maintenanciers</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.technicians}</span>
                        <span className="dash-stat-sub">Techs</span>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                className="filters-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label"><HiOutlineSearch size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom, email..." className="form-input" />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Rôle</label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="filter-select">
                            <option value="">Tous les rôles</option>
                            <option value="technician">Maintenancier</option>
                            <option value="receptionist">Agent</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                </div>
            </motion.div>


            {/* Table */}
            <motion.div
                className="diagnostics-table-container"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                <table className="diagnostics-table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Agence</th>
                            <th>Téléphone</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u, index) => (
                            <motion.tr
                                key={u.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * index, duration: 0.3 }}
                            >
                                <td>
                                    <strong>{u.first_name} {u.last_name}</strong>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`role-badge role-${u.role === 'technician' ? 'tech' : u.role === 'receptionist' ? 'agent' : 'admin'}`}>
                                        {ROLE_ICONS[u.role]} {ROLE_LABELS[u.role] || u.role}
                                    </span>
                                </td>
                                <td>{u.agency?.name || 'N/A'}</td>
                                <td>{u.phone || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${u.is_active ? 'status-completed' : 'status-cancelled'}`}>
                                        {u.is_active ? <><HiOutlineCheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Actif</> : <><HiOutlineLockClosed size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Inactif</>}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => toggleActive(u.id)} className="action-btn" title={u.is_active ? 'Désactiver' : 'Activer'}>
                                            {u.is_active ? <HiOutlineLockClosed size={16} /> : <HiOutlineLockOpen size={16} />}
                                        </button>
                                        <button onClick={() => setShowNotifyModal(u)} className="action-btn notify" title="Envoyer notification">
                                            <HiOutlineMail size={16} />
                                        </button>
                                        {isAdmin && u.id !== user.id && (
                                            <button onClick={() => setShowDeleteModal(u)} className="action-btn delete" title="Supprimer le compte">
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            {filteredUsers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon"><HiOutlineUserGroup size={48} /></div>
                    <h3>Aucun utilisateur trouvé</h3>
                </div>
            )}

            <AnimatePresence>
                {showDeleteModal && (
                    <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
                        <motion.div
                            className="premium-modal"
                            style={{ maxWidth: '440px' }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title" style={{ color: '#ef4444' }}>
                                    <HiOutlineTrash size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Confirmer la suppression
                                </h2>
                                <button className="btn-close" onClick={() => setShowDeleteModal(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="premium-modal-body">
                                <p style={{ color: '#cbd5e1', marginBottom: '16px' }}>Êtes-vous sûr de vouloir supprimer définitivement le compte de :</p>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <strong style={{ display: 'block', fontSize: '18px', color: '#fca5a5' }}>
                                        {showDeleteModal.first_name} {showDeleteModal.last_name}
                                    </strong>
                                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{showDeleteModal.email}</span>
                                </div>
                                <p style={{ color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                    <HiOutlineX size={14} style={{ marginRight: 4 }} /> Cette action est irréversible.
                                </p>
                            </div>

                            <div className="premium-modal-footer">
                                <button className="btn-secondary" onClick={() => setShowDeleteModal(null)}>Annuler</button>
                                <button
                                    className="btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                                    onClick={() => deleteUser(showDeleteModal.id)}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showNotifyModal && (
                    <div className="modal-overlay" onClick={() => setShowNotifyModal(null)}>
                        <motion.div
                            className="premium-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title">Envoyer une notification</h2>
                                <button className="btn-close" onClick={() => setShowNotifyModal(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="premium-modal-body">
                                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Destinataire :</span>
                                    <strong style={{ marginLeft: '8px', color: '#60a5fa' }}>{showNotifyModal.first_name} {showNotifyModal.last_name}</strong>
                                    <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '13px' }}>({showNotifyModal.email})</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Sujet</label>
                                    <input
                                        value={notifyData.subject}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="form-input"
                                        placeholder="Sujet du message"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '15px' }}>
                                    <label className="form-label">Message</label>
                                    <textarea
                                        value={notifyData.message}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, message: e.target.value }))}
                                        className="form-input"
                                        style={{ minHeight: '120px', width: '100%' }}
                                        placeholder="Votre message..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="premium-modal-footer">
                                <button className="btn-secondary" onClick={() => setShowNotifyModal(null)}>Annuler</button>
                                <button className="btn-primary" onClick={sendNotification}>
                                    <HiOutlinePaperAirplane size={18} style={{ marginRight: 8 }} /> Envoyer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <motion.div
                            className="premium-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title">Nouvel Utilisateur</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="premium-modal-body">
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Prénom</label>
                                            <input value={formData.first_name} onChange={(e) => updateField('first_name', e.target.value)} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nom</label>
                                            <input value={formData.last_name} onChange={(e) => updateField('last_name', e.target.value)} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Mot de passe</label>
                                            <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Rôle</label>
                                            <select value={formData.role} onChange={(e) => updateField('role', e.target.value)} className="form-input">
                                                <option value="receptionist">Agent</option>
                                                <option value="technician">Maintenancier</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Téléphone</label>
                                            <input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="form-input" />
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                                    <button type="submit" className="btn-primary">Créer le compte</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

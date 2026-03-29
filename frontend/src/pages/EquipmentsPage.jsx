import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../stores/authStore'
import {
    HiOutlineEye, HiOutlinePencil, HiOutlineTrash,
    HiOutlineX, HiOutlinePlusCircle
} from 'react-icons/hi'
import {
    HiOutlineWrenchScrewdriver, HiOutlineCheckCircle,
    HiOutlineArchiveBox, HiOutlineBuildingOffice,
    HiOutlineCalendarDays, HiOutlineCpuChip,
    HiOutlineHashtag, HiOutlineTag,
    HiOutlineArrowsRightLeft, HiOutlineArrowPath,
    HiOutlineTruck, HiOutlineNoSymbol
} from 'react-icons/hi2'
import './EquipmentsPage.css'

const STATUS_LABELS = {
    received: 'Reçu', waiting_diagnostic: 'Attente diagnostic', in_diagnostic: 'Diagnostic en cours',
    waiting_approval: 'Attente validation', waiting_parts: 'Attente pièces', in_repair: 'En réparation',
    quality_check: 'Contrôle qualité', repaired: 'Réparé', unrepairable: 'Irréparable',
    waiting_pickup: 'Attente retrait', delivered: 'Livré', archived: 'Archivé',
    replaced: 'Remplacé', exchanged: 'Échangé', transferred: 'Transféré', in_transit: 'En transit'
}

const STATUS_ICONS = {
    active: <HiOutlineCheckCircle />, received: <HiOutlineArchiveBox />,
    in_repair: <HiOutlineWrenchScrewdriver />, repaired: <HiOutlineCheckCircle />,
    delivered: <HiOutlineCheckCircle />, out_of_service: <HiOutlineX />
}

const INITIAL_FORM = {
    brand: '', model: '', serial_number: '', status: 'received',
    problem_reported: '', equipment_type: 'Ordinateur portable'
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 28, stiffness: 380 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.18 } }
}

const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }
    })
}

export default function EquipmentsPage() {
    const api = useApi()
    const socket = useSocket()
    const isAgent = useAuthStore((s) => s.isAgent)
    const user = useAuthStore((s) => s.user)
    const [equipments, setEquipments] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [viewingEquipment, setViewingEquipment] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [formData, setFormData] = useState({ ...INITIAL_FORM })

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/equipments')
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    setEquipments(res.data.map(e => ({
                        id: e.id,
                        reference: e.reference || `REF-${e.id}`,
                        brand: e.brand || 'N/A',
                        model: e.model || 'N/A',
                        serial_number: e.serial_number || 'N/A',
                        status: e.status || 'received',
                        agency_name: e.agency ? e.agency.name : 'N/A',
                        date: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : 'N/A'
                    })))
                }
            } catch (err) {
                console.log('Equipments: API indisponible, données de démo')
            }
        }
        load()
    }, [])

    // ✅ PHASE 5: Real-time socket listeners for equipments
    useEffect(() => {
        if (!socket) return

        const handleEquipmentCreated = (data) => {
            console.log('📡 New equipment created:', data)
            // Reload all equipments to get latest list
            api.get('/equipments').then(res => {
                if (res?.data && Array.isArray(res.data)) {
                    setEquipments(res.data.map(e => ({
                        id: e.id,
                        reference: e.reference || `REF-${e.id}`,
                        brand: e.brand || 'N/A',
                        model: e.model || 'N/A',
                        serial_number: e.serial_number || 'N/A',
                        status: e.status || 'received',
                        agency_name: e.agency ? e.agency.name : 'N/A',
                        date: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : 'N/A'
                    })))
                }
            }).catch(err => console.log('Error reloading equipments'))
        }

        const handleEquipmentUpdated = (data) => {
            console.log('📡 Equipment updated:', data)
            if (data.id) {
                setEquipments(prev =>
                    prev.map(e =>
                        e.id === data.id
                            ? { ...e, status: data.status || e.status }
                            : e
                    )
                )
            }
        }

        socket.on('equipment:created', handleEquipmentCreated)
        socket.on('equipment:status_updated', handleEquipmentUpdated)
        socket.on('equipment:updated', handleEquipmentUpdated)

        return () => {
            socket.off('equipment:created', handleEquipmentCreated)
            socket.off('equipment:status_updated', handleEquipmentUpdated)
            socket.off('equipment:updated', handleEquipmentUpdated)
        }
    }, [socket, api])

    const filteredEquipments = useMemo(() => {
        return equipments.filter(e => {
            const matchSearch = !searchQuery ||
                `${e.brand} ${e.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.serial_number || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = !selectedStatus || e.status === selectedStatus
            return matchSearch && matchStatus
        })
    }, [equipments, searchQuery, selectedStatus])

    const openCreate = () => { setFormData({ ...INITIAL_FORM }); setEditingId(null); setShowModal(true) }
    const openEdit = (equip) => {
        setFormData({
            brand: equip.brand || '', model: equip.model || '', serial_number: equip.serial_number || '',
            status: equip.status || 'received', problem_reported: equip.problem_reported || '',
            equipment_type: equip.equipment_type || 'Ordinateur portable'
        })
        setEditingId(equip.id)
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) return
        try { await api.delete(`/equipments/${id}`) } catch { /* ignore */ }
        setEquipments(prev => prev.filter(e => e.id !== id))
    }

    const handleView = (equip) => {
        setViewingEquipment(equip)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (editingId) {
            try { await api.put(`/equipments/${editingId}`, formData) } catch { /* ignore */ }
            setEquipments(prev => prev.map(eq => eq.id === editingId ? { ...eq, ...formData } : eq))
        } else {
            // Map frontend fields to backend schema
            const payload = {
                equipment_type: formData.equipment_type,
                brand: formData.brand,
                model: formData.model,
                serial_number: formData.serial_number,
                problem_description: formData.problem_reported || 'À diagnostiquer',
                agency_id: user?.agency_id,
                priority: 'normal'
            }
            try {
                const res = await api.post('/equipments', payload)
                if (res?.data) {
                    setEquipments(prev => [{
                        id: res.data.id,
                        reference: res.data.reference || `REF-${Date.now()}`,
                        brand: res.data.brand,
                        model: res.data.model,
                        serial_number: res.data.serial_number,
                        status: res.data.status || 'received',
                        agency_name: res.data.agency?.name || 'N/A',
                        date: new Date().toLocaleDateString('fr-FR'),
                        qr_token: res.data.qr_token
                    }, ...prev])
                    setShowModal(false)
                    return
                }
            } catch (err) {
                console.error('Erreur création équipement:', err)
            }
        }
        setShowModal(false)
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const changeEquipmentStatus = async (id, newStatus) => {
        try {
            await api.patch(`/equipments/${id}/status`, { status: newStatus })
            setEquipments(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
            setViewingEquipment(null)
        } catch (err) {
            console.error('Erreur changement statut:', err)
        }
    }

    const stats = useMemo(() => ({
        total: equipments.length,
        inRepair: equipments.filter(e => e.status === 'in_repair').length,
        active: equipments.filter(e => e.status === 'active' || e.status === 'repaired').length
    }), [equipments])

    return (
        <div className="equipments-page anim-fade-in">
            {/* Top Bar with Breadcrumbs */}
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Inventaire</span>
                </div>
                {!isAgent() && (
                    <div className="topbar-actions">
                        <button onClick={openCreate} className="topbar-btn-add">
                            <span><HiOutlinePlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Ajouter un équipement</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Title Section */}
            <div className="dashboard-title-section anim-slide-right">
                <h1 className="dashboard-title"><HiOutlineArchiveBox size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Inventaire du Parc</h1>
                <p className="dashboard-subtitle">
                    Gestion centralisée des équipements — {stats.inRepair} en maintenance
                </p>
            </div>

            {/* Stats Row */}
            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineArchiveBox size={22} /></div>
                        <div className="dash-stat-badge stable">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Équipements</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineWrenchScrewdriver size={22} /></div>
                        <div className="dash-stat-badge action">EN COURS</div>
                    </div>
                    <p className="dash-stat-label">En réparation</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.inRepair}</span>
                        <span className="dash-stat-sub">Flux</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">ACTIF</div>
                    </div>
                    <p className="dash-stat-label">Opérationnels</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.active}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section anim-slide-up">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Marque, modèle, référence..." className="form-input" />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="equipments-table-container anim-slide-up">
                <table className="equipments-table">
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Équipement</th>
                            <th>N° Série</th>
                            <th>Agence</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEquipments.map((equip, i) => (
                            <motion.tr
                                key={equip.id}
                                custom={i}
                                variants={rowVariants}
                                initial="hidden"
                                animate="visible"
                                layout
                            >
                                <td><span className="ref-badge">{equip.reference}</span></td>
                                <td><strong>{equip.brand} {equip.model}</strong></td>
                                <td><code className="serial-code">{equip.serial_number}</code></td>
                                <td>{equip.agency_name}</td>
                                <td>
                                    <span className={`status-badge status-${equip.status}`}>
                                        {STATUS_LABELS[equip.status] || equip.status}
                                    </span>
                                </td>
                                <td>{equip.date}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleView(equip)} className="action-btn view" title="Détails">
                                            <HiOutlineEye size={16} /> Voir
                                        </button>
                                        {!isAgent() && (
                                            <>
                                                <button onClick={() => openEdit(equip)} className="action-btn edit" title="Éditer">
                                                    <HiOutlinePencil size={16} /> Modifier
                                                </button>
                                                <button onClick={() => handleDelete(equip.id)} className="action-btn delete" title="Supprimer">
                                                    <HiOutlineTrash size={16} /> Suppr.
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredEquipments.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon"><HiOutlineArchiveBox size={40} /></div>
                        <h3>Aucun équipement trouvé</h3>
                        <p>Ajoutez un équipement ou ajustez vos filtres.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewingEquipment && (
                    <div className="modal-overlay" onClick={() => setViewingEquipment(null)}>
                        <motion.div
                            className="premium-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title">Détails de l'équipement</h2>
                                <button className="btn-close" onClick={() => setViewingEquipment(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="premium-modal-body">
                                <div className="stat-grid-modern">
                                    <div className="stat-card-modern">
                                        <span className="label">Référence</span>
                                        <span className="value">{viewingEquipment.reference}</span>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="label">Marque / Modèle</span>
                                        <span className="value">{viewingEquipment.brand} {viewingEquipment.model}</span>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="label">Statut</span>
                                        <span className="value">{STATUS_LABELS[viewingEquipment.status] || viewingEquipment.status}</span>
                                    </div>
                                </div>

                                <div className="info-section-modern" style={{ marginTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px' }}>
                                        <HiOutlineCalendarDays size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Historique
                                    </h3>
                                    <p style={{ color: '#cbd5e1' }}>Enregistré le {viewingEquipment.date} dans l'agence {viewingEquipment.agency_name}.</p>
                                </div>
                            </div>

                            <div className="premium-modal-footer" style={{ flexDirection: 'column', gap: '12px' }}>
                                {/* ===== Management Actions ===== */}
                                {!isAgent() && viewingEquipment.status !== 'delivered' && viewingEquipment.status !== 'archived' && (
                                    <div style={{
                                        display: 'flex', gap: '8px', width: '100%',
                                        padding: '12px 0', borderTop: '1px solid rgba(148,163,184,0.1)'
                                    }}>
                                        <button
                                            className="action-btn"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                            onClick={() => changeEquipmentStatus(viewingEquipment.id, 'replaced')}
                                            title="Marquer comme remplacé"
                                        >
                                            <HiOutlineNoSymbol size={16} /> Remplacer
                                        </button>
                                        <button
                                            className="action-btn"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', color: '#f97316', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                            onClick={() => changeEquipmentStatus(viewingEquipment.id, 'exchanged')}
                                            title="Marquer comme échangé"
                                        >
                                            <HiOutlineArrowsRightLeft size={16} /> Échanger
                                        </button>
                                        <button
                                            className="action-btn"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                            onClick={() => changeEquipmentStatus(viewingEquipment.id, 'transferred')}
                                            title="Transférer vers une autre agence"
                                        >
                                            <HiOutlineArrowPath size={16} /> Transférer
                                        </button>
                                        <button
                                            className="action-btn"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                            onClick={() => changeEquipmentStatus(viewingEquipment.id, 'in_transit')}
                                            title="Mettre en transit"
                                        >
                                            <HiOutlineTruck size={16} /> Transit
                                        </button>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                                    <button className="btn-secondary" onClick={() => setViewingEquipment(null)}>Fermer</button>
                                    {!isAgent() && (
                                        <button className="btn-primary" onClick={() => {
                                            setViewingEquipment(null)
                                            openEdit(viewingEquipment)
                                        }}>
                                            Modifier
                                        </button>
                                    )}
                                </div>
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
                                <h2 className="modal-title">
                                    {editingId ? 'Modifier l\'équipement' : 'Nouvel équipement'}
                                </h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="premium-modal-body">
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Marque</label>
                                            <input value={formData.brand} onChange={(e) => updateField('brand', e.target.value)} type="text" placeholder="Dell, HP..." className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Modèle</label>
                                            <input value={formData.model} onChange={(e) => updateField('model', e.target.value)} type="text" placeholder="Inspiron 15" className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">N° Série</label>
                                            <input value={formData.serial_number} onChange={(e) => updateField('serial_number', e.target.value)} type="text" placeholder="S/N" className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Type d'équipement</label>
                                            <select
                                                value={formData.equipment_type}
                                                onChange={(e) => updateField('equipment_type', e.target.value)}
                                                className="form-input"
                                            >
                                                <option value="Ordinateur portable">Ordinateur portable</option>
                                                <option value="Ordinateur de bureau">Ordinateur de bureau</option>
                                                <option value="Imprimante">Imprimante</option>
                                                <option value="Scanner">Scanner</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Problème signalé</label>
                                        <textarea
                                            value={formData.problem_reported}
                                            onChange={(e) => updateField('problem_reported', e.target.value)}
                                            placeholder="Description du problème"
                                            className="form-input"
                                            style={{ minHeight: '100px', width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div className="premium-modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                                    <button type="submit" className="btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

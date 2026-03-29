import { useState, useEffect, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { HiOutlinePlusCircle, HiOutlineX } from 'react-icons/hi'
import { HiOutlineBuildingOffice2, HiOutlineCheckCircle, HiOutlineWrenchScrewdriver, HiOutlineArchiveBox, HiOutlineExclamationTriangle, HiOutlineBellAlert, HiOutlineNoSymbol, HiOutlinePauseCircle } from 'react-icons/hi2'
import { useSocket } from '../hooks/useSocket'
import './ParcPage.css'

const EQUIPMENT_STATUS = {
    available: { label: 'Disponible', icon: <HiOutlineCheckCircle size={14} />, cls: 'eq-active' },
    active: { label: 'Actif', icon: <HiOutlineCheckCircle size={14} />, cls: 'eq-active' },
    in_intervention: { label: 'En intervention', icon: <HiOutlineWrenchScrewdriver size={14} />, cls: 'eq-intervention' },
    to_replace: { label: 'À remplacer', icon: <HiOutlineNoSymbol size={14} />, cls: 'eq-replace' },
    received: { label: 'En réparation', icon: <HiOutlineArchiveBox size={14} />, cls: 'eq-received' },
    standby: { label: 'En veille', icon: <HiOutlinePauseCircle size={14} />, cls: 'eq-standby' },
    in_repair: { label: 'En réparation', icon: <HiOutlineWrenchScrewdriver size={14} />, cls: 'eq-intervention' },
    waiting_diagnostic: { label: 'Attente diagnostic', icon: <HiOutlineExclamationTriangle size={14} />, cls: 'eq-standby' },
    in_diagnostic: { label: 'Diagnostic en cours', icon: <HiOutlineExclamationTriangle size={14} />, cls: 'eq-standby' },
    repaired: { label: 'Réparé', icon: <HiOutlineCheckCircle size={14} />, cls: 'eq-active' },
    delivered: { label: 'Livré', icon: <HiOutlineCheckCircle size={14} />, cls: 'eq-active' },
    replaced: { label: 'Remplacé', icon: <HiOutlineNoSymbol size={14} />, cls: 'eq-replace' },
    exchanged: { label: 'Échangé', icon: <HiOutlineArchiveBox size={14} />, cls: 'eq-standby' },
    transferred: { label: 'Transféré', icon: <HiOutlineArchiveBox size={14} />, cls: 'eq-standby' },
    in_transit: { label: 'En transit', icon: <HiOutlineExclamationTriangle size={14} />, cls: 'eq-standby' },
    waiting_pickup: { label: 'Prêt à récupérer', icon: <HiOutlineCheckCircle size={14} />, cls: 'eq-active' }
}

const EQUIPMENT_TYPES = [
    'Ordinateur portable', 'Ordinateur de bureau', 'Imprimante',
    'Scanner', 'Routeur/Switch', 'Onduleur (UPS)', 'Écran/Moniteur',
    'Tablette', 'Téléphone IP', 'Autre'
]

const BRANDS = [
    'Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple', 'Samsung',
    'Toshiba', 'Canon', 'Epson', 'Brother', 'Cisco', 'Autre'
]

// Demo data for agencies
const DEMO_AGENCIES = [
    { id: 1, name: 'Douala Centre', code: 'DLA-C' },
    { id: 2, name: 'Yaoundé Nord', code: 'YDE-N' },
    { id: 3, name: 'Bafoussam', code: 'BFS' },
    { id: 4, name: 'Bamenda', code: 'BDA' },
    { id: 5, name: 'Garoua', code: 'GRA' }
]

// Demo parc data per agency
const DEMO_EQUIPMENTS = []

export default function ParcPage() {
    const api = useApi()
    const user = useAuthStore((s) => s.user)
    const isAdmin = useAuthStore((s) => s.isAdmin)
    const isTechnician = useAuthStore((s) => s.isTechnician)
    const isAgent = useAuthStore((s) => s.isAgent)
    const socket = useSocket()

    const canManageAll = isAdmin() || isTechnician()

    const [agencies, setAgencies] = useState([])
    const [equipments, setEquipments] = useState([])
    const [selectedAgency, setSelectedAgency] = useState(canManageAll ? '' : (user?.agency_id || 1))
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [techView, setTechView] = useState('workshop') // 'workshop' or 'inventory'
    const [showAddModal, setShowAddModal] = useState(false)
    const [formData, setFormData] = useState({
        type: 'Ordinateur portable', brand: 'Dell', model: '', serial: '',
        assigned_to: '', notes: '', status: 'active'
    })

    // Load data from API
    const loadData = async () => {
        try {
            const [agRes, eqRes] = await Promise.all([
                api.get('/agencies'),
                api.get('/equipments')
            ])
            if (agRes?.data && Array.isArray(agRes.data)) {
                setAgencies(agRes.data)
            }
            if (eqRes?.data && Array.isArray(eqRes.data)) {
                setEquipments(eqRes.data.map(eq => ({
                    id: eq.id,
                    agency_id: eq.agency_id || (user?.agency_id || 1),
                    type: eq.equipment_type || 'Autre',
                    brand: eq.brand || 'N/A',
                    model: eq.model || 'N/A',
                    serial: eq.serial_number || 'N/A',
                    status: eq.status === 'in_repair' ? 'in_intervention' : (eq.status || 'active'),
                    assigned_to: eq.assigned_to || 'N/A',
                    assigned_technician_id: eq.assigned_technician_id,
                    purchase_date: eq.purchase_date || 'N/A',
                    notes: eq.notes || '',
                    intervention_ref: eq.intervention_ref || null
                })))
            }
        } catch {
            console.log('Parc: Erreur chargement API')
        }
    }

    useEffect(() => {
        loadData()

        // Synchronisation Temps-Réel (WebSocket)
        if (socket) {
            const handleEquipmentChange = () => {
                console.log("WebSocket reçu : equipment change")
                loadData()
            }

            socket.on('equipment:created', handleEquipmentChange)
            socket.on('equipment:updated', handleEquipmentChange)

            return () => {
                socket.off('equipment:created', handleEquipmentChange)
                socket.off('equipment:updated', handleEquipmentChange)
            }
        }
    }, [api, user?.id, socket])

    // For agents, lock to their agency
    useEffect(() => {
        if (isAgent() && user?.agency_id) {
            setSelectedAgency(user.agency_id)
        }
    }, [user, isAgent])

    // Filtered equipments
    const filteredEquipments = useMemo(() => {
        return equipments.filter(eq => {
            // Technician/Admin: "Mes Équipements" filter
            if (canManageAll && techView === 'workshop') {
                if (eq.assigned_technician_id !== user?.id && eq.received_by !== user?.id) return false
            }

            const matchAgency = !selectedAgency || eq.agency_id == selectedAgency
            const matchSearch = !searchQuery ||
                `${eq.brand} ${eq.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (eq.serial || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (eq.assigned_to || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = !selectedStatus || eq.status === selectedStatus
            const matchType = !selectedType || eq.type === selectedType
            return matchAgency && matchSearch && matchStatus && matchType
        })
    }, [equipments, selectedAgency, searchQuery, selectedStatus, selectedType, techView, isTechnician, user?.id])

    // Stats
    const stats = useMemo(() => {
        const scoped = selectedAgency
            ? equipments.filter(e => e.agency_id == selectedAgency)
            : equipments
        return {
            total: scoped.length,
            active: scoped.filter(e => e.status === 'active' || e.status === 'available').length,
            intervention: scoped.filter(e => e.status === 'in_intervention').length,
            toReplace: scoped.filter(e => e.status === 'to_replace').length
        }
    }, [equipments, selectedAgency])

    // Notifications
    const notifications = useMemo(() => {
        const scoped = selectedAgency
            ? equipments.filter(e => e.agency_id == selectedAgency)
            : equipments
        const notifs = []
        scoped.forEach(eq => {
            if (eq.status === 'in_intervention') {
                notifs.push({
                    type: 'intervention',
                    icon: <HiOutlineWrenchScrewdriver size={18} />,
                    message: `${eq.brand} ${eq.model} (${eq.serial}) est en intervention`,
                    ref: eq.intervention_ref,
                    cls: 'notif-warning'
                })
            }
            if (eq.status === 'to_replace') {
                notifs.push({
                    type: 'replace',
                    icon: <HiOutlineExclamationTriangle size={18} />,
                    message: `${eq.brand} ${eq.model} (${eq.serial}) — à remplacer`,
                    details: eq.notes,
                    cls: 'notif-danger'
                })
            }
        })
        return notifs
    }, [equipments, selectedAgency])

    const getAgencyName = (id) => {
        const ag = agencies.find(a => a.id == id)
        return ag ? `${ag.name} (${ag.code})` : 'Inconnue'
    }

    const handleAddEquipment = async (e) => {
        e.preventDefault()
        const agencyId = isAgent() ? user?.agency_id : selectedAgency

        try {
            const payload = {
                brand: formData.brand,
                model: formData.model,
                serial_number: formData.serial,
                equipment_type: formData.type,
                problem_description: formData.notes || 'Ajouté au parc informatique',
                agency_id: agencyId,
                priority: 'normal'
            }
            const res = await api.post('/equipments', payload)
            if (res?.data) {
                setEquipments(prev => [{
                    id: res.data.id,
                    agency_id: agencyId,
                    type: formData.type,
                    brand: formData.brand,
                    model: formData.model,
                    serial: formData.serial,
                    status: 'received',
                    assigned_to: formData.assigned_to || 'N/A',
                    purchase_date: new Date().toISOString().split('T')[0],
                    notes: formData.notes
                }, ...prev])
                setShowAddModal(false)
                setFormData({ type: 'Ordinateur portable', brand: 'Dell', model: '', serial: '', assigned_to: '', notes: '', status: 'active' })
                return
            }
        } catch (err) {
            console.error('Erreur ajout équipement au parc:', err)
        }
        setShowAddModal(false)
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const changeStatus = async (id, newStatus) => {
        try {
            await api.patch(`/equipments/${id}/status`, { status: newStatus })
        } catch (err) {
            console.error('Erreur changement de statut:', err)
        }
        setEquipments(prev => prev.map(eq =>
            eq.id === id ? { ...eq, status: newStatus } : eq
        ))
    }

    return (
        <div className="parc-page anim-fade-in">
            {/* Top Bar with Breadcrumbs */}
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Parc Informatique</span>
                </div>
                <div className="topbar-actions">
                    <button onClick={() => setShowAddModal(true)} className="topbar-btn-add">
                        <span><HiOutlinePlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Ajouter un équipement</span>
                    </button>
                </div>
            </div>

            {/* Title Section & Agency Hub */}
            <div className="dashboard-title-section anim-slide-right" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 className="dashboard-title"><HiOutlineBuildingOffice2 size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Parc Informatique</h1>
                    <p className="dashboard-subtitle">
                        {canManageAll
                            ? (techView === 'workshop' ? `Mes Équipements — ${filteredEquipments.length} équipements` : `Parc des Agences — ${filteredEquipments.length} équipements`)
                            : `Mon agence — ${stats.total} équipements`
                        }
                    </p>
                </div>

                {canManageAll && (
                    <div className="tech-view-tabs anim-fade-in" style={{
                        display: 'flex',
                        background: 'rgba(30, 41, 59, 0.4)',
                        padding: '4px',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                        <button
                            className={`tech-tab ${techView === 'workshop' ? 'active' : ''}`}
                            onClick={() => setTechView('workshop')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: techView === 'workshop' ? '#fff' : '#94a3b8',
                                background: techView === 'workshop' ? '#3b82f6' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Mes Équipements
                        </button>
                        <button
                            className={`tech-tab ${techView === 'inventory' ? 'active' : ''}`}
                            onClick={() => setTechView('inventory')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: techView === 'inventory' ? '#fff' : '#94a3b8',
                                background: techView === 'inventory' ? '#3b82f6' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Parc des Agences
                        </button>
                    </div>
                )}

                {canManageAll && (
                    <div className="agency-hub-selector anim-fade-in" style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        padding: '12px 20px',
                        borderRadius: '14px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vue Agence :</span>
                        <select
                            value={selectedAgency}
                            onChange={(e) => setSelectedAgency(e.target.value)}
                            style={{
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#f1f5f9',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Toutes les agences</option>
                            {agencies.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="parc-notifications anim-slide-up">
                    <h3 className="notif-header"><HiOutlineBellAlert size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Alertes ({notifications.length})</h3>
                    <div className="notif-list">
                        {notifications.map((n, idx) => (
                            <div key={idx} className={`notif-item ${n.cls}`}>
                                <span className="notif-icon">{n.icon}</span>
                                <div className="notif-content">
                                    <span className="notif-message">{n.message}</span>
                                    {n.ref && <span className="notif-ref">→ {n.ref}</span>}
                                    {n.details && <span className="notif-details">{n.details}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineBuildingOffice2 size={22} /></div>
                        <div className="dash-stat-badge stable">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Équipements</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">ACTIF</div>
                    </div>
                    <p className="dash-stat-label">En service</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.active}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineWrenchScrewdriver size={22} /></div>
                        <div className="dash-stat-badge action">MAINTENANCE</div>
                    </div>
                    <p className="dash-stat-label">Réparation</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.intervention}</span>
                        <span className="dash-stat-sub warning">En cours</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon purple"><HiOutlineNoSymbol size={22} /></div>
                        <div className="dash-stat-badge urgent">CRITIQUE</div>
                    </div>
                    <p className="dash-stat-label">À remplacer</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.toReplace}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section anim-slide-up">
                <div className="filters-grid">
                    {/* Agency selector — only for Admin/Tech */}
                    {canManageAll && (
                        <div className="filter-group">
                            <label className="filter-label">Agence</label>
                            <select
                                value={selectedAgency}
                                onChange={(e) => setSelectedAgency(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Toutes les agences</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Marque, modèle, N° série..." className="form-input" />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
                            <option value="">Tous</option>
                            {Object.entries(EQUIPMENT_STATUS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Type</label>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="filter-select">
                            <option value="">Tous</option>
                            {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Equipment Table */}
            <div className="parc-table-container anim-slide-up">
                <table className="parc-table">
                    <thead>
                        <tr>
                            <th>Statut</th>
                            <th>Équipement</th>
                            <th>N° Série</th>
                            {canManageAll && !selectedAgency && <th>Agence</th>}
                            <th>Affecté à</th>
                            <th>Date achat</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEquipments.map(eq => {
                            const st = EQUIPMENT_STATUS[eq.status] || EQUIPMENT_STATUS.active
                            return (
                                <tr key={eq.id} className={eq.status === 'to_replace' ? 'row-danger' : eq.status === 'in_intervention' ? 'row-warning' : ''}>
                                    <td>
                                        <span className={`eq-status-badge ${st.cls}`}>
                                            {st.icon} {st.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="eq-info">
                                            <strong>{eq.brand} {eq.model}</strong>
                                            <span className="eq-type">{eq.type}</span>
                                        </div>
                                    </td>
                                    <td><code className="serial-code">{eq.serial}</code></td>
                                    {canManageAll && !selectedAgency && <td><span className="agency-tag">{getAgencyName(eq.agency_id)}</span></td>}
                                    <td>{eq.assigned_to || '—'}</td>
                                    <td>{eq.purchase_date || '—'}</td>
                                    <td>
                                        <span className="eq-notes">{eq.notes || '—'}</span>
                                        {eq.intervention_ref && (
                                            <span className="intervention-tag">→ {eq.intervention_ref}</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {eq.status === 'active' && (
                                                <button onClick={() => changeStatus(eq.id, 'in_intervention')} className="action-btn" title="Envoyer en intervention"><HiOutlineWrenchScrewdriver size={16} /></button>
                                            )}
                                            {eq.status === 'active' && (
                                                <button onClick={() => changeStatus(eq.id, 'to_replace')} className="action-btn delete" title="Marquer à remplacer"><HiOutlineNoSymbol size={16} /></button>
                                            )}
                                            {(eq.status === 'in_intervention' || eq.status === 'to_replace') && (
                                                <button onClick={() => changeStatus(eq.id, 'active')} className="action-btn" title="Remettre actif"><HiOutlineCheckCircle size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredEquipments.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon"><HiOutlineBuildingOffice2 size={40} /></div>
                        <h3>Aucun équipement trouvé</h3>
                        <p>Ajoutez un équipement à votre parc ou changez de filtre</p>
                    </div>
                )}
            </div>

            {/* Add Equipment Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><HiOutlinePlusCircle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Ajouter au Parc</h2>
                            <button onClick={() => setShowAddModal(false)} className="close-btn"><HiOutlineX size={20} /></button>
                        </div>
                        <form onSubmit={handleAddEquipment} className="form">
                            {canManageAll && (
                                <div className="form-group">
                                    <label className="form-label">Agence</label>
                                    <select value={selectedAgency || ''} onChange={(e) => setSelectedAgency(e.target.value)} className="form-input" required>
                                        <option value="">-- Choisir l'agence --</option>
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type d'équipement</label>
                                    <select value={formData.type} onChange={(e) => updateField('type', e.target.value)} className="form-input" required>
                                        {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Marque</label>
                                    <select value={formData.brand} onChange={(e) => updateField('brand', e.target.value)} className="form-input" required>
                                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Modèle</label>
                                    <input value={formData.model} onChange={(e) => updateField('model', e.target.value)} placeholder="Ex: Latitude 5540" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">N° Série</label>
                                    <input value={formData.serial} onChange={(e) => updateField('serial', e.target.value)} placeholder="S/N ou TAG" className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Affecté à</label>
                                <input value={formData.assigned_to} onChange={(e) => updateField('assigned_to', e.target.value)} placeholder="Ex: Poste Caisse 1, Bureau Manager..." className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Informations supplémentaires..." className="form-textarea" rows={2} />
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Annuler</button>
                                <button type="submit" className="btn-primary">Ajouter au parc</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

import { useState, useMemo, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineEye, HiOutlinePlusCircle, HiOutlineX } from 'react-icons/hi'
import { HiOutlineViewColumns, HiOutlineListBullet, HiOutlineWrenchScrewdriver, HiOutlineCheckCircle, HiOutlineBolt, HiOutlineComputerDesktop, HiOutlineCalendarDays, HiOutlineClock, HiOutlineUserCircle, HiOutlineDocumentText, HiOutlineTruck } from 'react-icons/hi2'
import ChatWindow from '../components/ChatWindow'
import InterventionReport from '../components/InterventionReport'
import { useSocket } from '../hooks/useSocket'
import './InterventionsPage.css'

const STATUS_LABELS = {
    pending: 'En attente', planned: 'Planifiée', in_progress: 'En cours',
    completed: 'Terminée', cancelled: 'Annulée', on_hold: 'En pause'
}

const PRIORITY_LABELS = { critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse' }
const PRIORITY_CLASSES = { critical: 'priority-critical', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }

const INITIAL_FORM = {
    equipment_id: '',
    actions_performed: '',
    priority: 'medium',
    status: 'pending',
    estimated_duration: '2h',
    expertise_notes: '',
    estimated_cost: '',
    technician_id: ''
}

export default function InterventionsPage() {
    const api = useApi()
    const isAgentFn = useAuthStore((s) => s.isAgent)
    const isAgentUser = isAgentFn()
    const socket = useSocket()
    const [interventions, setInterventions] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [selectedIntervention, setSelectedIntervention] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedPriority, setSelectedPriority] = useState('')
    const [formData, setFormData] = useState({ ...INITIAL_FORM })
    const [viewMode, setViewMode] = useState('list')
    const [technicians, setTechnicians] = useState([])
    const [equipmentOptions, setEquipmentOptions] = useState([])
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const [completing, setCompleting] = useState(false)

    const loadData = async () => {
        try {
            const res = await api.get('/interventions')
            if (res?.data && Array.isArray(res.data)) {
                setInterventions(res.data.map(i => ({
                    id: i.id,
                    reference: i.reference || `INT-${i.id}`,
                    equipment_name: i.equipment ? `${i.equipment.brand} ${i.equipment.model}` : 'N/A',
                    title: i.actions_performed || i.title || 'Intervention',
                    technician_name: i.technician ? `${i.technician.first_name} ${i.technician.last_name}` : 'N/A',
                    priority: i.priority || 'medium',
                    status: i.status || 'pending',
                    progress: i.progress || 0,
                    maintenance_step: i.maintenance_step || 0,
                    date: i.created_at ? new Date(i.created_at).toLocaleDateString('fr-FR') : 'N/A',
                    description: i.result_notes || i.description || '',
                    estimated_duration: i.estimated_duration || 'N/A',
                    parts_used: i.parts_used || []
                })))
            }
        } catch (err) {
            console.log('Interventions: Erreur chargement')
        }
    }

    useEffect(() => {
        loadData()
        if (!isAgentUser) {
            api.get('/users').then(res => {
                if (res?.data) {
                    setTechnicians(res.data.filter(u => ['technician', 'admin', 'super_admin', 'manager'].includes(u.role)))
                }
            }).catch(e => console.error('Erreur chargement users', e))
        }

        // Synchronisation Temps-Réel (WebSocket)
        if (socket) {
            const handleInterventionChange = () => {
                console.log("WebSocket reçu : intervention change")
                loadData()
            }

            socket.on('intervention:created', handleInterventionChange)
            socket.on('intervention:updated', handleInterventionChange)

            return () => {
                socket.off('intervention:created', handleInterventionChange)
                socket.off('intervention:updated', handleInterventionChange)
            }
        }
    }, [api, isAgentUser, socket])

    // Load available equipments for new interventions
    useEffect(() => {
        if (showModal) {
            api.get('/equipments').then(res => {
                if (res?.data) {
                    const available = res.data.filter(eq => ['received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval', 'waiting_parts'].includes(eq.status))
                    setEquipmentOptions(available)
                }
            }).catch(e => console.error('Erreur équipements dispo', e))
        }
    }, [showModal, api])

    const filteredInterventions = useMemo(() => {
        return interventions.filter(i => {
            const matchSearch = !searchQuery ||
                (i.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (i.equipment_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (i.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = !selectedStatus || i.status === selectedStatus
            const matchPriority = !selectedPriority || i.priority === selectedPriority
            return matchSearch && matchStatus && matchPriority
        })
    }, [interventions, searchQuery, selectedStatus, selectedPriority])

    const handleView = async (intervention) => {
        try {
            const res = await api.get(`/interventions/${intervention.id}`)
            if (res?.data) {
                setSelectedIntervention({ ...intervention, detailedLogs: res.data.logs || [] })
            } else {
                setSelectedIntervention(intervention)
            }
        } catch (err) {
            setSelectedIntervention(intervention)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            const finalNotes = `Diagnostic & Devis : ${formData.expertise_notes}\nCoût estimé : ${formData.estimated_cost}€\n\nNotes techniques : ${formData.result_notes}`;
            await api.post('/interventions', { ...formData, result_notes: finalNotes })
            await loadData()
            setShowModal(false)
        } catch (err) {
            console.error('Erreur création intervention:', err)
            setShowModal(false)
        }
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10b981'
        if (progress >= 40) return '#f59e0b'
        return '#3b82f6'
    }

    const stats = useMemo(() => {
        return {
            total: interventions.length,
            in_progress: interventions.filter(i => i.status === 'in_progress').length,
            completed: interventions.filter(i => i.status === 'completed').length,
            critical: interventions.filter(i => i.priority === 'critical').length
        }
    }, [interventions])

    return (
        <div className="interventions-page anim-fade-in">

            {/* Title Section */}
            <div className="dashboard-title-section anim-slide-right">
                <h1 className="dashboard-title"><HiOutlineWrenchScrewdriver size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Maintenance & Réparations</h1>
                <p className="dashboard-subtitle">
                    Gestion des interventions techniques — {stats.in_progress} chantiers en cours
                </p>
            </div>

            {/* Stats Row */}
            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineWrenchScrewdriver size={22} /></div>
                        <div className="dash-stat-badge stable">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Interventions</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineBolt size={22} /></div>
                        <div className="dash-stat-badge action">ACTIF</div>
                    </div>
                    <p className="dash-stat-label">En cours</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.in_progress}</span>
                        <span className="dash-stat-sub">Boost</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">FINI</div>
                    </div>
                    <p className="dash-stat-label">Terminées</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.completed}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section anim-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div className="filters-grid" style={{ flex: 1, margin: 0 }}>
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Référence, titre..." className="form-input" />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
                            <option value="">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="planned">Planifiée</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminée</option>
                            <option value="on_hold">En pause</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Priorité</label>
                        <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="filter-select">
                            <option value="">Toutes priorités</option>
                            <option value="critical">Critique</option>
                            <option value="high">Haute</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Basse</option>
                        </select>
                    </div>
                </div>
                <div className="view-mode-toggle" style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.5)', padding: '6px', borderRadius: '12px' }}>
                    <button onClick={() => setViewMode('list')} className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} style={{ padding: '8px 12px', borderRadius: '8px', background: viewMode === 'list' ? '#3b82f6' : 'transparent', color: viewMode === 'list' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                        <HiOutlineListBullet size={20} />
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} style={{ padding: '8px 12px', borderRadius: '8px', background: viewMode === 'kanban' ? '#3b82f6' : 'transparent', color: viewMode === 'kanban' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                        <HiOutlineViewColumns size={20} />
                    </button>
                </div>
                {!isAgentUser && (
                    <button onClick={() => { setFormData({ ...INITIAL_FORM }); setShowModal(true) }} className="btn-primary">
                        <HiOutlinePlusCircle size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Nouveau Dossier
                    </button>
                )}
            </div>

            {/* Content Display based on ViewMode */}
            {viewMode === 'list' ? (
                <div className="interventions-grid anim-slide-up">
                    {filteredInterventions.map((intervention) => (
                        <div key={intervention.id} className={`intervention-card status-border-${intervention.status}`}>
                            <div className="int-card-header">
                                <div className="int-card-title-row">
                                    <span className="ref-badge">{intervention.reference}</span>
                                    <span className={`priority-badge ${PRIORITY_CLASSES[intervention.priority] || ''}`}>
                                        {PRIORITY_LABELS[intervention.priority] || intervention.priority}
                                    </span>
                                </div>
                                <h3 className="intervention-title">{intervention.title}</h3>
                                <div className="intervention-equipment-box" style={{
                                    background: 'rgba(15, 23, 42, 0.3)',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(148, 163, 184, 0.1)',
                                    marginTop: '10px'
                                }}>
                                    <p className="intervention-equipment" style={{ margin: 0, fontWeight: '600', color: '#f1f5f9' }}>
                                        <HiOutlineComputerDesktop size={16} style={{ verticalAlign: 'middle', marginRight: 8, color: '#3b82f6' }} />
                                        {intervention.equipment_name}
                                    </p>
                                </div>
                            </div>

                            <div className="int-card-body">
                                <div className="int-info-row">
                                    <span style={{ color: '#94a3b8' }}><HiOutlineUserCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {intervention.technician_name}</span>
                                    <span style={{ color: '#94a3b8' }}><HiOutlineCalendarDays size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {intervention.date}</span>
                                </div>
                                <div className="int-info-row" style={{ marginTop: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}><HiOutlineClock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {intervention.estimated_duration}</span>
                                    <span className={`status-badge status-${intervention.status}`} style={{ fontWeight: '700' }}>
                                        {STATUS_LABELS[intervention.status] || intervention.status}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="progress-section">
                                    <div className="progress-header">
                                        <span>Progression</span>
                                        <span className="progress-value">{intervention.progress}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${intervention.progress}%`,
                                                background: getProgressColor(intervention.progress)
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="int-card-footer">
                                <button onClick={() => handleView(intervention)} className="action-btn" title="Détails"><HiOutlineEye size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Détails</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="kanban-board anim-slide-up" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
                    {['pending', 'in_progress', 'completed'].map(statusKey => (
                        <div key={statusKey} className="kanban-column" style={{ minWidth: '320px', flex: 1, background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{STATUS_LABELS[statusKey]}</span>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                    {filteredInterventions.filter(i => i.status === statusKey).length}
                                </span>
                            </h3>
                            <div className="kanban-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredInterventions.filter(i => i.status === statusKey).map(intervention => (
                                    <div key={intervention.id} onClick={() => handleView(intervention)} className="kanban-card" style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', cursor: 'pointer', borderLeft: `4px solid ${getProgressColor(intervention.progress)}`, transition: 'all 0.2s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{intervention.reference}</span>
                                            <span className={`priority-badge ${PRIORITY_CLASSES[intervention.priority] || ''}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{PRIORITY_LABELS[intervention.priority]}</span>
                                        </div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{intervention.title}</h4>
                                        <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <HiOutlineComputerDesktop /> {intervention.equipment_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredInterventions.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon"><HiOutlineWrenchScrewdriver size={40} /></div>
                    <h3>Aucune intervention trouvée</h3>
                    <p>Ajustez vos filtres de recherche.</p>
                </div>
            )}
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
                                <h2 className="modal-title">Nouvelle Intervention</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="premium-modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Titre de l'intervention / Actions</label>
                                        <input value={formData.actions_performed} onChange={(e) => updateField('actions_performed', e.target.value)} type="text" placeholder="Ex: Remplacement disque dur" className="form-input" required />
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Expertise / Tests effectués (Diagnostic)</label>
                                        <textarea value={formData.expertise_notes} onChange={(e) => updateField('expertise_notes', e.target.value)} placeholder="Résultat de l'analyse, pannes trouvées" className="form-input" style={{ minHeight: '60px', width: '100%' }} />
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Coût estimé / Devis (€)</label>
                                        <input value={formData.estimated_cost} onChange={(e) => updateField('estimated_cost', e.target.value)} type="number" placeholder="Ex: 150" className="form-input" />
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Notes de réparation</label>
                                        <textarea value={formData.result_notes} onChange={(e) => updateField('result_notes', e.target.value)} placeholder="Description détaillée" className="form-input" style={{ minHeight: '80px', width: '100%' }} required />
                                    </div>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Priorité</label>
                                            <select value={formData.priority} onChange={(e) => updateField('priority', e.target.value)} className="form-input">
                                                <option value="low">Basse</option>
                                                <option value="medium">Moyenne</option>
                                                <option value="high">Haute</option>
                                                <option value="critical">Critique</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Durée estimée</label>
                                            <input value={formData.estimated_duration} onChange={(e) => updateField('estimated_duration', e.target.value)} type="text" placeholder="Ex: 2h" className="form-input" />
                                        </div>
                                        {/* Sélection de l'équipement au lieu de taper l'id */}
                                        <div className="form-group">
                                            <label className="form-label">Équipement à traiter</label>
                                            <select value={formData.equipment_id} onChange={(e) => updateField('equipment_id', e.target.value)} className="form-input" required>
                                                <option value="">Sélectionnez un équipement (Dépôts)</option>
                                                {equipmentOptions.map(eq => (
                                                    <option key={eq.id} value={eq.id}>
                                                        {eq.reference} - {eq.brand} {eq.model} ({eq.status === 'received' ? 'Nouveau Dépôt' : 'Parc'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Assigner à</label>
                                            <select value={formData.technician_id} onChange={(e) => updateField('technician_id', e.target.value)} className="form-input">
                                                <option value="">(Assigné à moi-même)</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                                    <button type="submit" className="btn-primary">Créer l'intervention</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {selectedIntervention && (
                    <div className="modal-overlay" onClick={() => setSelectedIntervention(null)}>
                        <motion.div
                            className="premium-modal"
                            style={{ maxWidth: '1000px' }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title">Détails de l'intervention</h2>
                                <button className="btn-close" onClick={() => setSelectedIntervention(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="premium-modal-body" style={{ padding: '0' }}>
                                <div className="detail-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: '600px' }}>
                                    <div className="detail-info-pane" style={{ padding: '32px', overflowY: 'auto', borderRight: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                        <div className="stat-grid-modern">
                                            <div className="stat-card-modern">
                                                <span className="label">Référence</span>
                                                <span className="value">{selectedIntervention.reference}</span>
                                            </div>
                                            <div className="stat-card-modern">
                                                <span className="label">Statut</span>
                                                <span className="value">{STATUS_LABELS[selectedIntervention.status]}</span>
                                            </div>
                                            <div className="stat-card-modern">
                                                <span className="label">Équipement</span>
                                                <span className="value">{selectedIntervention.equipment_name}</span>
                                            </div>
                                        </div>

                                        <div className="info-section-modern" style={{ marginTop: '24px' }}>
                                            <h3 style={{ fontSize: '18px', color: '#f1f5f9', marginBottom: '12px' }}>{selectedIntervention.title}</h3>
                                            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>{selectedIntervention.description}</p>
                                        </div>

                                        <div className="info-section-modern" style={{ marginTop: '24px' }}>
                                            <h3><HiOutlineUserCircle size={18} /> Technicien</h3>
                                            <p>{selectedIntervention.technician_name}</p>
                                        </div>

                                        {!isAgentUser && selectedIntervention.status !== 'completed' && (
                                            <div className="milestone-actions" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                                <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Progression Maintenance</h4>
                                                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await api.patch(`/interventions/${selectedIntervention.id}/advance`)
                                                                if (res?.success || res?.id) {
                                                                    await loadData()
                                                                    handleView(selectedIntervention)
                                                                }
                                                            } catch (err) {
                                                                console.error("Erreur d'avancement")
                                                            }
                                                        }}
                                                        className="btn-primary"
                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                    >
                                                        <HiOutlineBolt size={18} />
                                                        Valider Étape Suivante
                                                    </button>

                                                    {selectedIntervention.status === 'in_progress' && (
                                                        <button
                                                            onClick={() => setShowCompleteModal(true)}
                                                            style={{
                                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                padding: '12px', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)',
                                                                background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', fontWeight: '700', cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            <HiOutlineCheckCircle size={18} />
                                                            Terminer l'intervention
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {selectedIntervention.status === 'completed' && (
                                            <div className="milestone-actions" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                                <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Export</h4>
                                                <button
                                                    onClick={() => setShowReport(true)}
                                                    className="btn-secondary"
                                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid #f97316', color: '#f97316' }}
                                                >
                                                    <HiOutlineDocumentText size={18} />
                                                    Rapport d'intervention
                                                </button>
                                            </div>
                                        )}

                                        {/* Timeline Section */}
                                        <div className="intervention-timeline" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                            <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Historique du Dossier</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid rgba(59, 130, 246, 0.3)' }}>
                                                {selectedIntervention.detailedLogs && selectedIntervention.detailedLogs.length > 0 ? (
                                                    selectedIntervention.detailedLogs.map((log, idx) => (
                                                        <div key={idx} style={{ position: 'relative' }}>
                                                            <div style={{ position: 'absolute', left: '-21px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #0f172a' }}></div>
                                                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#f1f5f9' }}>{log.description}</p>
                                                            <p style={{ margin: '0', fontSize: '11px', color: '#64748b' }}>
                                                                {new Date(log.created_at).toLocaleString('fr-FR')}
                                                                {log.user && ` par ${log.user.first_name}`}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Aucun historique détaillé.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-chat-pane" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
                                        <ChatWindow interventionId={selectedIntervention.id} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Completion Modal — choose transit or pickup */}
            {showCompleteModal && selectedIntervention && (
                <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
                    <div className="premium-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <div className="premium-modal-header">
                            <h2 className="modal-title">Terminer l'intervention</h2>
                            <button className="btn-close" onClick={() => setShowCompleteModal(false)}>×</button>
                        </div>
                        <div className="premium-modal-body" style={{ padding: '24px' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
                                Que souhaitez-vous faire avec l'équipement ?
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    disabled={completing}
                                    onClick={async () => {
                                        setCompleting(true)
                                        try {
                                            await api.patch(`/interventions/${selectedIntervention.id}/complete`, { next_action: 'in_transit' })
                                            await loadData()
                                            setShowCompleteModal(false)
                                            setSelectedIntervention(null)
                                        } catch (err) { console.error(err) }
                                        finally { setCompleting(false) }
                                    }}
                                    style={{
                                        padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)',
                                        background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', fontWeight: '700', cursor: 'pointer',
                                        fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left'
                                    }}
                                >
                                    <HiOutlineTruck size={22} />
                                    <div>
                                        <div>🚚 Envoyer en transit</div>
                                        <div style={{ fontSize: '12px', fontWeight: '400', color: '#64748b', marginTop: '4px' }}>L'équipement sera acheminé vers l'agence</div>
                                    </div>
                                </button>
                                <button
                                    disabled={completing}
                                    onClick={async () => {
                                        setCompleting(true)
                                        try {
                                            await api.patch(`/interventions/${selectedIntervention.id}/complete`, { next_action: 'waiting_pickup' })
                                            await loadData()
                                            setShowCompleteModal(false)
                                            setSelectedIntervention(null)
                                        } catch (err) { console.error(err) }
                                        finally { setCompleting(false) }
                                    }}
                                    style={{
                                        padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)',
                                        background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', fontWeight: '700', cursor: 'pointer',
                                        fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left'
                                    }}
                                >
                                    <HiOutlineCheckCircle size={22} />
                                    <div>
                                        <div>✅ Prêt à récupérer</div>
                                        <div style={{ fontSize: '12px', fontWeight: '400', color: '#64748b', marginTop: '4px' }}>L'agent peut venir chercher l'équipement</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report modal */}
            {showReport && selectedIntervention && (
                <InterventionReport
                    intervention={selectedIntervention}
                    equipment={{ reference: selectedIntervention.reference, brand: '', model: selectedIntervention.equipment_name, serial_number: '', status: selectedIntervention.status }}
                    diagnostic={null}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    )
}

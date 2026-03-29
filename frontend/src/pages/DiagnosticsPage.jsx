import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../stores/authStore'
import {
    HiOutlineSearch, HiOutlineClock, HiOutlineEye,
    HiOutlinePencil, HiOutlinePlusCircle, HiOutlineX
} from 'react-icons/hi'
import {
    HiOutlineCheckCircle, HiOutlineMagnifyingGlass,
    HiOutlineCpuChip, HiOutlineUser, HiOutlineCalendarDays,
    HiOutlineDocumentText, HiOutlineExclamationTriangle,
    HiOutlineFlag, HiOutlinePrinter
} from 'react-icons/hi2'
import DiagnosticReport from '../components/DiagnosticReport'
import './DiagnosticsPage.css'

const PRIORITY_LABELS = { critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse' }
const STATUS_LABELS = { pending: 'En attente', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }
const PRIORITY_CLASSES = { critical: 'priority-critical', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }

const INITIAL_FORM = {
    equipment_id: '',
    fault_type: '',
    fault_description: '',
    result: 'pending',
    estimated_cost: '',
    estimated_hours: '',
    notes: ''
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

export default function DiagnosticsPage() {
    const api = useApi()
    const socket = useSocket()
    const isAgent = useAuthStore((s) => s.isAgent)
    const [diagnostics, setDiagnostics] = useState([])
    const [equipments, setEquipments] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [viewingDiag, setViewingDiag] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedPriority, setSelectedPriority] = useState('')
    const [formData, setFormData] = useState({ ...INITIAL_FORM })
    const [showReport, setShowReport] = useState(false)

    const loadData = async () => {
        try {
            const res = await api.get('/diagnostics')
            if (res?.data && Array.isArray(res.data)) {
                setDiagnostics(res.data.map(d => ({
                    id: d.id,
                    reference: d.reference || `DIAG-${d.id}`,
                    equipment_id: d.equipment?.id,
                    equipment_reference: d.equipment?.reference || 'N/A',
                    equipment_name: d.equipment ? `${d.equipment.brand} ${d.equipment.model}` : 'N/A',
                    title: d.fault_type || d.title || 'Diagnostic',
                    technician_name: d.technician ? `${d.technician.first_name} ${d.technician.last_name}` : 'N/A',
                    priority: d.equipment?.priority || 'medium',
                    status: (d.result && d.result !== 'pending') ? 'completed' : 'pending',
                    result: d.result || 'pending',
                    date: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : 'N/A',
                    description: d.fault_description || d.description || '',
                    notes: d.notes || '',
                    estimated_cost: d.estimated_cost,
                    estimated_hours: d.estimated_hours,
                    fault_type: d.fault_type
                })))
            }
        } catch (err) {
            console.log('Diagnostics: Erreur chargement')
        }
    }

    useEffect(() => {
        loadData()
    }, [api])

    // ✅ PHASE 5: Real-time socket listeners for diagnostics
    useEffect(() => {
        if (!socket) return

        const handleDiagnosticCreated = (data) => {
            console.log('📡 New diagnostic created:', data)
            loadData() // Reload to get latest diagnostics
        }

        const handleDiagnosticUpdated = (data) => {
            console.log('📡 Diagnostic updated:', data)
            setDiagnostics(prev =>
                prev.map(d => d.id === data.id ? { ...d, result: data.result, status: data.result !== 'pending' ? 'completed' : 'pending' } : d)
            )
        }

        socket.on('diagnostic:created', handleDiagnosticCreated)
        socket.on('diagnostic:updated', handleDiagnosticUpdated)
        socket.on('equipment:status_updated', handleDiagnosticUpdated) // Related equipment status changes

        return () => {
            socket.off('diagnostic:created', handleDiagnosticCreated)
            socket.off('diagnostic:updated', handleDiagnosticUpdated)
            socket.off('equipment:status_updated', handleDiagnosticUpdated)
        }
    }, [socket])

    const filteredDiagnostics = useMemo(() => {
        return diagnostics.filter(d => {
            const matchSearch = !searchQuery ||
                (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.equipment_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = !selectedStatus || d.status === selectedStatus
            const matchPriority = !selectedPriority || d.priority === selectedPriority
            return matchSearch && matchStatus && matchPriority
        })
    }, [diagnostics, searchQuery, selectedStatus, selectedPriority])

    const openCreate = () => {
        setFormData({ ...INITIAL_FORM })
        setEditingId(null)
        setShowModal(true)
    }

    // Charger les équipements disponibles pour le sélecteur
    useEffect(() => {
        const loadEquipments = async () => {
            try {
                const res = await api.get('/equipments')
                if (res?.data && Array.isArray(res.data)) {
                    setEquipments(res.data)
                }
            } catch { /* ignore */ }
        }
        loadEquipments()
    }, [])

    const openEdit = (diag) => {
        setFormData({
            equipment_id: diag.equipment_id || '',
            fault_type: diag.fault_type || diag.title || '',
            fault_description: diag.fault_description || diag.description || '',
            result: diag.result || 'pending',
            estimated_cost: diag.estimated_cost || '',
            estimated_hours: diag.estimated_hours || '',
            notes: diag.notes || ''
        })
        setEditingId(diag.id)
        setShowModal(true)
    }

    const handleComplete = async (id) => {
        try {
            await api.patch(`/diagnostics/${id}/complete`)
            setDiagnostics(prev => prev.map(d =>
                d.id === id ? { ...d, status: 'completed' } : d
            ))
            toast.success('Diagnostic marqué comme terminé')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la terminaison')
        }
    }

    const handleView = (diag) => {
        setViewingDiag(diag)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        const payload = {
            equipment_id: formData.equipment_id,
            fault_type: formData.fault_type,
            fault_description: formData.fault_description,
            result: formData.result || 'pending',
            estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : 0,
            estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : 0,
            notes: formData.notes || ''
        }

        try {
            if (editingId) {
                await api.put(`/diagnostics/${editingId}`, payload)
            } else {
                await api.post('/diagnostics', payload)
            }
            // RELOAD EVERYTHING FOR GUARANTEED PERSISTENCE
            await loadData()
            setShowModal(false)
        } catch (err) {
            console.error('Erreur sauvegarde diagnostic:', err)
            // Still close modal to avoid stuck state
            setShowModal(false)
        }
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const stats = useMemo(() => {
        return {
            total: diagnostics.length,
            pending: diagnostics.filter(d => d.status === 'pending').length,
            in_progress: diagnostics.filter(d => d.status === 'in_progress').length,
            completed: diagnostics.filter(d => d.status === 'completed').length
        }
    }, [diagnostics])

    return (
        <div className="diagnostics-page anim-fade-in">
            {/* Top Bar with Breadcrumbs */}
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Diagnostics</span>
                </div>
                {!isAgent() && (
                    <div className="topbar-actions">
                        <button onClick={openCreate} className="topbar-btn-add">
                            <span><HiOutlinePlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Nouveau diagnostic</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Title Section */}
            <div className="dashboard-title-section anim-slide-right">
                <h1 className="dashboard-title"><HiOutlineMagnifyingGlass size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} />Diagnostics & Tests</h1>
                <p className="dashboard-subtitle">
                    Suivi technique des équipements — {stats.in_progress} en cours d'analyse
                </p>
            </div>

            {/* Stats Row */}
            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineSearch size={22} /></div>
                        <div className="dash-stat-badge stable">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Analyses</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineClock size={22} /></div>
                        <div className="dash-stat-badge action">ATTENTE</div>
                    </div>
                    <p className="dash-stat-label">À traiter</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.pending + stats.in_progress}</span>
                        <span className="dash-stat-sub">Flux</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">SUCCÈS</div>
                    </div>
                    <p className="dash-stat-label">Terminés</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.completed}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section anim-slide-up">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Référence, titre..." className="form-input" />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
                            <option value="">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminé</option>
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
            </div>

            {/* Table Container */}
            <div className="diagnostics-table-container anim-slide-up">
                <table className="diagnostics-table">
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Équipement</th>
                            <th>Titre</th>
                            <th>Technicien</th>
                            <th>Priorité</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDiagnostics.map((diag, i) => (
                            <motion.tr
                                key={diag.id}
                                custom={i}
                                variants={rowVariants}
                                initial="hidden"
                                animate="visible"
                                layout
                            >
                                <td><span className="ref-badge">{diag.reference}</span></td>
                                <td>{diag.equipment_name}</td>
                                <td>{diag.title}</td>
                                <td>{diag.technician_name}</td>
                                <td>
                                    <span className={`priority-badge ${PRIORITY_CLASSES[diag.priority] || ''}`}>
                                        {PRIORITY_LABELS[diag.priority] || diag.priority}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge status-${diag.status}`}>
                                        {STATUS_LABELS[diag.status] || diag.status}
                                    </span>
                                </td>
                                <td>{diag.date}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleView(diag)} className="action-btn view" title="Voir détails">
                                            <HiOutlineEye size={16} /> Voir
                                        </button>
                                        {!isAgent() && diag.status !== 'completed' && (
                                            <button onClick={() => handleComplete(diag.id)} className="action-btn complete" title="Terminer">
                                                <HiOutlineCheckCircle size={16} /> Terminer
                                            </button>
                                        )}
                                        {!isAgent() && (
                                            <button onClick={() => openEdit(diag)} className="action-btn edit" title="Modifier">
                                                <HiOutlinePencil size={16} /> Modifier
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredDiagnostics.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon"><HiOutlineSearch size={40} /></div>
                        <h3>Aucun diagnostic trouvé</h3>
                        <p>Ajustez vos filtres de recherche.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewingDiag && (
                    <div className="modal-overlay" onClick={() => setViewingDiag(null)}>
                        <motion.div
                            className="premium-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="premium-modal-header">
                                <h2 className="modal-title">Détails du Diagnostic</h2>
                                <button className="btn-close" onClick={() => setViewingDiag(null)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <div className="premium-modal-body">
                                <div className="stat-grid-modern">
                                    <div className="stat-card-modern">
                                        <span className="label">Référence</span>
                                        <span className="value">{viewingDiag.reference}</span>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="label">Technicien</span>
                                        <span className="value">{viewingDiag.technician_name}</span>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="label">Priorité</span>
                                        <span className="value">{PRIORITY_LABELS[viewingDiag.priority] || viewingDiag.priority}</span>
                                    </div>
                                    <div className="stat-card-modern">
                                        <span className="label">Statut</span>
                                        <span className="value">{STATUS_LABELS[viewingDiag.status] || viewingDiag.status}</span>
                                    </div>
                                </div>

                                <div className="info-section-modern" style={{ marginTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px' }}>
                                        <HiOutlineDocumentText size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Description
                                    </h3>
                                    <div className="description-box-modern" style={{ color: '#cbd5e1', padding: '12px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px' }}>
                                        {viewingDiag.description}
                                    </div>
                                </div>
                            </div>

                            <div className="premium-modal-footer">
                                <button className="btn-secondary" onClick={() => setViewingDiag(null)}>Fermer</button>
                                {!isAgent() && (
                                    <button className="btn-primary" onClick={() => {
                                        setViewingDiag(null)
                                        openEdit(viewingDiag)
                                    }}>
                                        Modifier
                                    </button>
                                )}
                                {viewingDiag.status === 'completed' && (
                                    <button onClick={() => setShowReport(true)} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                                        borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                                    }}>
                                        <HiOutlinePrinter size={16} /> Rapport
                                    </button>
                                )}
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
                                    {editingId ? 'Modifier le diagnostic' : 'Nouveau diagnostic'}
                                </h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="premium-modal-body">
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label className="form-label">Équipement</label>
                                        <select value={formData.equipment_id} onChange={(e) => updateField('equipment_id', e.target.value)} className="form-input" required>
                                            <option value="">— Sélectionner un équipement —</option>
                                            {equipments.map(eq => (
                                                <option key={eq.id} value={eq.id}>
                                                    {eq.reference || eq.id} — {eq.brand} {eq.model}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Type de panne</label>
                                            <input value={formData.fault_type} onChange={(e) => updateField('fault_type', e.target.value)} type="text" placeholder="Ex: Panne alimentation" className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Résultat</label>
                                            <select value={formData.result} onChange={(e) => updateField('result', e.target.value)} className="form-input">
                                                <option value="pending">En attente</option>
                                                <option value="repairable">Réparable</option>
                                                <option value="unrepairable">Irréparable</option>
                                                <option value="needs_parts">Pièces nécessaires</option>
                                                <option value="to_replace">À remplacer</option>
                                                <option value="to_exchange">À échanger</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Coût estimé (€)</label>
                                            <input value={formData.estimated_cost} onChange={(e) => updateField('estimated_cost', e.target.value)} type="number" step="0.01" placeholder="0.00" className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Heures estimées</label>
                                            <input value={formData.estimated_hours} onChange={(e) => updateField('estimated_hours', e.target.value)} type="number" step="0.5" placeholder="0" className="form-input" />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Description de la panne</label>
                                        <textarea
                                            value={formData.fault_description}
                                            onChange={(e) => updateField('fault_description', e.target.value)}
                                            placeholder="Description détaillée du problème constaté..."
                                            className="form-input"
                                            style={{ minHeight: '100px', width: '100%' }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Notes additionnelles</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            placeholder="Remarques, observations..."
                                            className="form-input"
                                            style={{ minHeight: '60px', width: '100%' }}
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

            {/* Diagnostic Report Modal */}
            {showReport && viewingDiag && (
                <DiagnosticReport
                    diagnostic={{
                        ...viewingDiag,
                        fault_description: viewingDiag.description,
                        created_at: viewingDiag.date,
                        technician: { first_name: viewingDiag.technician_name, last_name: '' }
                    }}
                    equipment={{
                        reference: viewingDiag.equipment_reference || viewingDiag.reference,
                        brand: viewingDiag.equipment_name?.split(' ')[0] || '',
                        model: viewingDiag.equipment_name?.split(' ').slice(1).join(' ') || '',
                        serial_number: '',
                        agency: { name: '' }
                    }}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    )
}

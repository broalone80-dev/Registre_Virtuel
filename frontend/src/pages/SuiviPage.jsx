import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { useSocket } from '../hooks/useSocket'
import { HiOutlineClipboardList, HiOutlineCalendar } from 'react-icons/hi'
import {
    HiOutlineArchiveBox, HiOutlineWrenchScrewdriver, HiOutlineCheckCircle,
    HiOutlineMagnifyingGlass, HiOutlineUserCircle, HiOutlineHomeModern,
    HiOutlineArrowPath, HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2'
import EquipmentChat from '../components/EquipmentChat'
import './SuiviPage.css'

const STATUS_STEPS = [
    { key: 'received', label: 'Reçu', icon: <HiOutlineArchiveBox size={18} />, description: 'Équipement réceptionné' },
    { key: 'diagnosed', label: 'Diagnostic', icon: <HiOutlineMagnifyingGlass size={18} />, description: 'Diagnostic en cours' },
    { key: 'in_repair', label: 'Réparation', icon: <HiOutlineWrenchScrewdriver size={18} />, description: 'Intervention en cours' },
    { key: 'repaired', label: 'Prêt', icon: <HiOutlineCheckCircle size={18} />, description: 'Prêt à récupérer' },
    { key: 'delivered', label: 'Livré', icon: <HiOutlineHomeModern size={18} />, description: 'Remis au propriétaire' }
]

const STATUS_INDEX = { received: 0, pending: 0, diagnosed: 1, in_repair: 2, repaired: 3, delivered: 4, completed: 3, cancelled: -1 }

const MAINTENANCE_LABELS = [
    'Attente prise en charge',
    'Expertise & Démontage',
    'Réparation Active',
    'Tests & Calibration',
    'Nettoyage & Remontage',
    'Finalisé'
]

const PRIORITY_MAP = {
    critical: { label: 'Critique', cls: 'priority-critical' },
    high: { label: 'Haute', cls: 'priority-high' },
    normal: { label: 'Moyenne', cls: 'priority-medium' },
    low: { label: 'Basse', cls: 'priority-low' }
}
export default function SuiviPage() {
    const api = useApi()
    const socket = useSocket()
    const user = useAuthStore((s) => s.user)
    const isAgent = useAuthStore((s) => s.isAgent)

    const [equipments, setEquipments] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [loading, setLoading] = useState(true)
    const [confirmingId, setConfirmingId] = useState(null)
    const [chatOpenId, setChatOpenId] = useState(null)

    const loadEquipments = async () => {
        setLoading(true)
        try {
            // L'agent ne doit voir que les équipements qu'il a déposé lui-même
            const baseParams = user?.agency_id ? `agency_id=${user.agency_id}` : ''
            const agentParam = isAgent() ? `received_by=${user.id}` : ''

            const paramsList = [baseParams, agentParam].filter(Boolean)
            const paramsString = paramsList.length ? `?${paramsList.join('&')}` : ''

            const res = await api.get(`/equipments${paramsString}`)
            if (res?.data && Array.isArray(res.data)) {
                // Filtrer: ne montrer que les équipements en cours de suivi
                // Les équipements livrés/disponibles sont de retour dans le parc — plus de suivi
                const HIDDEN_STATUSES = ['delivered', 'available']
                setEquipments(res.data
                    .filter(eq => !HIDDEN_STATUSES.includes(eq.status))
                    .map(eq => ({
                        ...eq,
                        interventions: eq.interventions || []
                    }))
                )
            }
        } catch (err) {
            console.error('Error loading equipments:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEquipments()
    }, [user?.agency_id])

    // Écouter les mises à jour en temps réel via Socket.io
    useEffect(() => {
        if (!socket) return

        const handleStatusUpdate = (data) => {
            setEquipments(prev => prev.map(eq =>
                eq.id === data.equipmentId ? { ...eq, status: data.status } : eq
            ))
        }

        const handleProgressUpdate = (data) => {
            setEquipments(prev => prev.map(eq => {
                if (eq.id === data.equipmentId) {
                    // Mettre à jour le progrès dans la première intervention trouvée ou correspondante
                    const updatedInterventions = eq.interventions.map(inv =>
                        inv.id === data.interventionId ? { ...inv, progress: data.progress, maintenance_step: data.step } : inv
                    )
                    return { ...eq, interventions: updatedInterventions }
                }
                return eq
            }))
        }

        socket.on('equipment:status_updated', handleStatusUpdate)
        socket.on('intervention:progress_updated', handleProgressUpdate)

        return () => {
            socket.off('equipment:status_updated', handleStatusUpdate)
            socket.off('intervention:progress_updated', handleProgressUpdate)
        }
    }, [socket])

    const filteredEquipments = useMemo(() => {
        return equipments.filter(eq => {
            // Le Suivi ne concerne que les équipements récupérés pour intervention
            if (!eq.interventions || eq.interventions.length === 0) {
                return false;
            }

            const matchSearch = !searchQuery ||
                (eq.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                `${eq.brand} ${eq.model}`.toLowerCase().includes(searchQuery.toLowerCase())
            const matchStatus = !selectedStatus || eq.status === selectedStatus
            return matchSearch && matchStatus
        })
    }, [equipments, searchQuery, selectedStatus])

    const stats = useMemo(() => ({
        total: equipments.length,
        ready: equipments.filter(e => e.status === 'repaired').length,
        inProgress: equipments.filter(e => ['diagnosed', 'in_repair'].includes(e.status)).length,
        waiting: equipments.filter(e => e.status === 'received').length
    }), [equipments])

    const getStepIndex = (status) => STATUS_INDEX[status] ?? 0
    const getPriorityInfo = (p) => PRIORITY_MAP[p] || { label: p, cls: '' }

    return (
        <div className="suivi-page anim-fade-in">
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Suivi</span>
                </div>
                <button onClick={loadEquipments} className="btn-icon-refresh" title="Actualiser">
                    <HiOutlineArrowPath size={20} className={loading ? 'spinning' : ''} />
                </button>
            </div>

            <div className="dashboard-title-section anim-slide-right">
                <h1 className="dashboard-title">
                    <HiOutlineClipboardList size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} />
                    Suivi des Équipements
                </h1>
                <p className="dashboard-subtitle">
                    Suivez l'avancement des réparations de votre agence — {stats.ready} prêt(s)
                </p>
            </div>

            {stats.ready > 0 && (
                <div className="notification-banner anim-slide-up">
                    <HiOutlineCheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    <strong>{stats.ready} équipement(s)</strong> prêt(s) à récupérer !
                </div>
            )}

            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineArchiveBox size={22} /></div>
                        <div className="dash-stat-badge">TOTAL</div>
                    </div>
                    <p className="dash-stat-label">Déposés</p>
                    <div className="dash-stat-bottom"><span className="dash-stat-value">{stats.total}</span></div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineWrenchScrewdriver size={22} /></div>
                        <div className="dash-stat-badge action">EN COURS</div>
                    </div>
                    <p className="dash-stat-label">Interventions</p>
                    <div className="dash-stat-bottom"><span className="dash-stat-value">{stats.inProgress}</span></div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge">READY</div>
                    </div>
                    <p className="dash-stat-label">Prêts</p>
                    <div className="dash-stat-bottom"><span className="dash-stat-value">{stats.ready}</span></div>
                </div>
            </div>

            <div className="filters-section anim-slide-up">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Référence, marque, modèle..."
                            className="form-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
                            <option value="">Tous les statuts</option>
                            <option value="received">Reçu</option>
                            <option value="in_diagnostic">En diagnostic</option>
                            <option value="in_repair">En réparation</option>
                            <option value="repaired">Prêt</option>
                            <option value="delivered">Livré</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="suivi-list anim-slide-up">
                {filteredEquipments.map(eq => {
                    const currentStep = getStepIndex(eq.status)
                    const priorityInfo = getPriorityInfo(eq.priority)
                    const mainIntervention = eq.interventions?.[0]
                    const progress = mainIntervention?.progress || 0

                    return (
                        <div key={eq.id} className={`suivi-card ${eq.status === 'repaired' ? 'ready-glow' : ''}`}>
                            <div className="suivi-card-header">
                                <div className="suivi-info">
                                    <div className="suivi-ref-row">
                                        <span className="ref-badge">{eq.reference}</span>
                                        <span className={`priority-badge ${priorityInfo.cls}`}>{priorityInfo.label}</span>
                                    </div>
                                    <h3 className="suivi-equipment-name">{eq.brand} {eq.model}</h3>
                                    <div className="suivi-meta">
                                        <span><HiOutlineCalendar size={14} /> {new Date(eq.created_at).toLocaleDateString()}</span>
                                        {eq.assignedTechnician && <span><HiOutlineUserCircle size={14} /> {eq.assignedTechnician.first_name}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Elite Timeline logic */}
                            <div className="suivi-timeline">
                                <div className="tl-line-bg"></div>
                                <div className="tl-line" style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 90}%` }}></div>
                                {STATUS_STEPS.map((step, idx) => (
                                    <div key={step.key} className={`tl-step ${idx < currentStep ? 'done' : ''} ${idx === currentStep ? 'current' : ''}`}>
                                        <div className="tl-dot">
                                            {idx < currentStep ? <HiOutlineCheckCircle size={22} /> : step.icon}
                                        </div>
                                        <div className="tl-label">{step.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar (Visible only during repair) */}
                            {eq.status === 'in_repair' && (
                                <div className="suivi-progress-section anim-slide-up">
                                    <div className="progress-header">
                                        <div className="suivi-stage-badge">
                                            <HiOutlineWrenchScrewdriver size={16} />
                                            <span>{MAINTENANCE_LABELS[mainIntervention?.maintenance_step || 0]}</span>
                                        </div>
                                        <span className="progress-value">{progress}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <motion.div
                                            className="progress-bar-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    {mainIntervention?.result_notes && (
                                        <p className="latest-notes">
                                            "{mainIntervention.result_notes}"
                                        </p>
                                    )}
                                </div>
                            )}

                            {eq.diagnostics?.[0] && (
                                <div className="suivi-diagnostic" style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    border: '1px solid rgba(148, 163, 184, 0.1)',
                                    borderRadius: '14px',
                                    padding: '16px 20px',
                                    marginTop: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                                            <HiOutlineMagnifyingGlass size={16} /> Diagnostic
                                        </span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            background: eq.diagnostics[0].result === 'repairable' ? 'rgba(34, 197, 94, 0.15)' :
                                                eq.diagnostics[0].result === 'unrepairable' ? 'rgba(239, 68, 68, 0.15)' :
                                                    eq.diagnostics[0].result === 'to_replace' ? 'rgba(239, 68, 68, 0.15)' :
                                                        eq.diagnostics[0].result === 'to_exchange' ? 'rgba(249, 115, 22, 0.15)' :
                                                            eq.diagnostics[0].result === 'needs_parts' ? 'rgba(249, 115, 22, 0.15)' :
                                                                'rgba(148, 163, 184, 0.15)',
                                            color: eq.diagnostics[0].result === 'repairable' ? '#22c55e' :
                                                eq.diagnostics[0].result === 'unrepairable' ? '#ef4444' :
                                                    eq.diagnostics[0].result === 'to_replace' ? '#ef4444' :
                                                        eq.diagnostics[0].result === 'to_exchange' ? '#f97316' :
                                                            eq.diagnostics[0].result === 'needs_parts' ? '#f97316' :
                                                                '#94a3b8'
                                        }}>
                                            {{ repairable: 'Réparable', unrepairable: 'Irréparable', needs_parts: 'Attente pièces', pending: 'En cours', to_replace: 'À remplacer', to_exchange: 'À échanger' }[eq.diagnostics[0].result] || eq.diagnostics[0].result}
                                        </span>
                                    </div>
                                    {eq.diagnostics[0].fault_description && (
                                        <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                                            {eq.diagnostics[0].fault_description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                                        {eq.diagnostics[0].estimated_cost && (
                                            <span>💰 Coût estimé: <strong style={{ color: '#f1f5f9' }}>{Number(eq.diagnostics[0].estimated_cost).toLocaleString()} FCFA</strong></span>
                                        )}
                                        {eq.diagnostics[0].estimated_hours && (
                                            <span>⏱️ Durée: <strong style={{ color: '#f1f5f9' }}>{eq.diagnostics[0].estimated_hours}h</strong></span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bouton de confirmation de récupération pour l'agent */}
                            {isAgent() && ['waiting_pickup', 'in_transit'].includes(eq.status) && (
                                <div style={{
                                    marginTop: '14px',
                                    padding: '14px 20px',
                                    background: 'rgba(34, 197, 94, 0.08)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderRadius: '14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{ color: '#22c55e', fontSize: '14px' }}>
                                            {eq.status === 'in_transit' ? '🚚 En transit vers votre agence' : '✅ Prêt à récupérer'}
                                        </strong>
                                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
                                            Confirmez la récupération après réception de l'équipement
                                        </p>
                                    </div>
                                    <button
                                        disabled={confirmingId === eq.id}
                                        onClick={async () => {
                                            setConfirmingId(eq.id)
                                            try {
                                                await api.patch(`/equipments/${eq.id}/confirm-pickup`)
                                                // Retirer l'équipement du suivi — il est de retour dans le parc
                                                setEquipments(prev => prev.filter(e => e.id !== eq.id))
                                            } catch (err) {
                                                console.error('Erreur confirmation:', err)
                                            } finally {
                                                setConfirmingId(null)
                                            }
                                        }}
                                        style={{
                                            padding: '10px 22px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            cursor: confirmingId === eq.id ? 'wait' : 'pointer',
                                            opacity: confirmingId === eq.id ? 0.6 : 1,
                                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {confirmingId === eq.id ? 'Confirmation...' : 'Confirmer la récupération'}
                                    </button>
                                </div>
                            )}

                            {/* Chat toggle */}
                            <button
                                onClick={() => setChatOpenId(chatOpenId === eq.id ? null : eq.id)}
                                style={{
                                    marginTop: '14px', width: '100%', padding: '10px', borderRadius: '10px',
                                    background: chatOpenId === eq.id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                                    border: `1px solid ${chatOpenId === eq.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.08)'}`,
                                    color: chatOpenId === eq.id ? '#3b82f6' : '#94a3b8',
                                    fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <HiOutlineChatBubbleLeftRight size={16} />
                                {chatOpenId === eq.id ? 'Fermer la discussion' : 'Discussion'}
                            </button>

                            {chatOpenId === eq.id && (
                                <EquipmentChat equipmentId={eq.id} />
                            )}
                        </div>
                    )
                })}
            </div>

            {filteredEquipments.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon"><HiOutlineClipboardList size={40} /></div>
                    <h3>Aucun équipement trouvé</h3>
                    <p>Déposez un équipement pour commencer le suivi</p>
                </div>
            )}
        </div>
    )
}

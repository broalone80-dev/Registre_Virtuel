import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { HiOutlineDesktopComputer, HiOutlineClipboardList, HiOutlineClock } from 'react-icons/hi'
import { HiOutlineWrenchScrewdriver, HiOutlineBolt, HiOutlineCheckCircle, HiOutlineCog, HiOutlinePlusCircle, HiOutlineQrCode } from 'react-icons/hi2'
import { useSocket } from '../hooks/useSocket'
import './DashboardPage.css'

/* ============================================
   ANIMATED COUNTER HOOK
   ============================================ */
function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0)
    const ref = useRef(null)

    useEffect(() => {
        if (target === 0) { setValue(0); return }
        let start = 0
        const startTime = performance.now()
        const step = (timestamp) => {
            const progress = Math.min((timestamp - startTime) / duration, 1)
            // easeOutExpo for a snappy feel
            const eased = 1 - Math.pow(2, -10 * progress)
            const current = Math.round(eased * target)
            setValue(current)
            if (progress < 1) {
                ref.current = requestAnimationFrame(step)
            }
        }
        ref.current = requestAnimationFrame(step)
        return () => ref.current && cancelAnimationFrame(ref.current)
    }, [target, duration])

    return value
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const api = useApi()
    const isAgent = useAuthStore((s) => s.isAgent)
    const isAdmin = useAuthStore((s) => s.isAdmin)
    const isTechnician = useAuthStore((s) => s.isTechnician)
    const user = useAuthStore((s) => s.user)
    const socket = useSocket()

    const [equipments, setEquipments] = useState([])
    const [refreshTick, setRefreshTick] = useState(0)

    const [rawStats, setRawStats] = useState({
        total: 0, inRepair: 0, diagnostics: 0, interventions: 0
    })

    // Animated counters
    const animTotal = useCountUp(rawStats.total, 1500)
    const animRepair = useCountUp(rawStats.inRepair, 1000)
    const animDiag = useCountUp(rawStats.diagnostics, 1200)
    const animInt = useCountUp(rawStats.interventions, 800)

    const [recentActivities, setRecentActivities] = useState([])

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch equipments
                const eqRes = await api.get('/equipments')
                if (eqRes?.data && Array.isArray(eqRes.data) && eqRes.data.length > 0) {
                    setEquipments(eqRes.data.slice(0, 3).map(e => ({
                        id: e.id,
                        name: `${e.brand} ${e.model}`,
                        ref: e.reference || `EU-${e.id}`,
                        status: e.status || 'active',
                        statusLabel: e.status === 'in_repair' ? 'En réparation' : e.status === 'active' ? 'Opérationnel' : 'Hors Service',
                        date: e.received_at ? new Date(e.received_at).toLocaleDateString('fr-FR') : 'N/A',
                        info: 'DERNIER DÉPÔT'
                    })))
                    setRawStats(prev => ({
                        ...prev,
                        total: eqRes.data.length,
                        inRepair: eqRes.data.filter(e => e.status === 'in_repair').length
                    }))
                }
            } catch {
                console.log('Dashboard: équipements indisponibles')
            }

            // Fetch diagnostics and map to activities
            try {
                const diagRes = await api.get('/diagnostics')
                if (diagRes?.data && Array.isArray(diagRes.data)) {
                    setRawStats(prev => ({ ...prev, diagnostics: diagRes.data.length }))
                    // Map to recent activities
                    setRecentActivities(diagRes.data.slice(0, 5).map(d => {
                        const dStatus = (d.result && d.result !== 'pending') ? 'completed' : 'pending'
                        return {
                            id: d.id,
                            icon: dStatus === 'completed' ? <HiOutlineCheckCircle size={20} /> : <HiOutlineClock size={20} />,
                            iconBg: dStatus === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                            iconColor: dStatus === 'completed' ? '#6ee7b7' : '#fbbf24',
                            title: d.fault_type || 'Diagnostic',
                            desc: d.equipment ? `${d.equipment.brand} ${d.equipment.model}` : 'Équipement inconnu',
                            tag: dStatus === 'completed' ? 'TERMINÉ' : 'EN ATTENTE',
                            tagCls: dStatus === 'completed' ? 'tag-ok' : 'tag-processing',
                            time: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : 'Récemment'
                        }
                    }))
                }
            } catch {
                console.log('Dashboard: diagnostics indisponibles')
            }

            // Fetch interventions count
            try {
                const intRes = await api.get('/interventions')
                if (intRes?.data && Array.isArray(intRes.data)) {
                    setRawStats(prev => ({ ...prev, interventions: intRes.data.length }))
                }
            } catch {
                console.log('Dashboard: interventions indisponibles')
            }
        }
        loadData()
    }, [refreshTick, api])

    // Synchronisation Temps-Réel
    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                console.log("WebSocket reçu : maj dashboard analytique")
                setRefreshTick(prev => prev + 1)
            }
            socket.on('equipment:created', handleUpdate)
            socket.on('equipment:updated', handleUpdate)
            socket.on('intervention:created', handleUpdate)
            socket.on('intervention:updated', handleUpdate)

            return () => {
                socket.off('equipment:created', handleUpdate)
                socket.off('equipment:updated', handleUpdate)
                socket.off('intervention:created', handleUpdate)
                socket.off('intervention:updated', handleUpdate)
            }
        }
    }, [socket])

    const getStatusClass = (status) => {
        if (status === 'in_repair') return 'status-repair'
        if (status === 'active') return 'status-active'
        return 'status-oos'
    }

    const formatNumber = (n) => n.toLocaleString('fr-FR')

    return (
        <div className="dashboard-page anim-fade-in">
            {/* Page Header Area */}
            <header className="page-header anim-slide-down">
                <div className="header-info">
                    <h1 className="page-title">Tableau de bord</h1>
                    <p className="page-subtitle">Aperçu analytique de votre parc informatique en temps réel.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate(isAgent() ? '/depot' : '/equipments')}>
                        <HiOutlinePlusCircle size={20} />
                        <span>Nouveau dépôt</span>
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/scan')}>
                        <HiOutlineQrCode size={20} />
                        <span>Scanner</span>
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            {isAdmin() && (
                <section className="dashboard-stats anim-stagger">
                    <div className="stat-card blue anim-slide-up">
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineDesktopComputer size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Parc Global (Équipements)</span>
                            <h2 className="stat-number">{formatNumber(animTotal)}</h2>
                            <span className="stat-trend positive">Vue superviseur</span>
                        </div>
                    </div>
                    <div className="stat-card orange anim-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineWrenchScrewdriver size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">En Réparation</span>
                            <h2 className="stat-number">{formatNumber(animRepair)}</h2>
                            <span className="stat-trend warning">● {rawStats.inRepair} urgents</span>
                        </div>
                    </div>
                    <div className="stat-card purple anim-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineBolt size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Total Interventions</span>
                            <h2 className="stat-number">{animInt < 10 ? `0${animInt}` : animInt}</h2>
                            <span className="stat-trend info">➜ Historique IT</span>
                        </div>
                    </div>
                </section>
            )}

            {isTechnician() && (
                <section className="dashboard-stats anim-stagger">
                    <div className="stat-card orange anim-slide-up">
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineWrenchScrewdriver size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Chantiers Actifs</span>
                            <h2 className="stat-number">{formatNumber(animInt)}</h2>
                            <span className="stat-trend warning">À traiter</span>
                        </div>
                    </div>
                    <div className="stat-card purple anim-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineBolt size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Priorité Rapide</span>
                            <h2 className="stat-number">{formatNumber(rawStats.inRepair)}</h2>
                            <span className="stat-trend info">Machines en faille</span>
                        </div>
                    </div>
                    <div className="stat-card green anim-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineCheckCircle size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Mes Résolutions</span>
                            <h2 className="stat-number">{formatNumber(animDiag)}</h2>
                            <span className="stat-trend positive">✓ Bravo !</span>
                        </div>
                    </div>
                </section>
            )}

            {isAgent() && (
                <section className="dashboard-stats anim-stagger">
                    <div className="stat-card blue anim-slide-up">
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineDesktopComputer size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Total Déposé</span>
                            <h2 className="stat-number">{formatNumber(animTotal)}</h2>
                            <span className="stat-trend info">Par l'agence</span>
                        </div>
                    </div>
                    <div className="stat-card green anim-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="stat-visual"><div className="stat-icon-blob"><HiOutlineCheckCircle size={28} /></div></div>
                        <div className="stat-meta">
                            <span className="stat-label">Prêts à livrer</span>
                            <h2 className="stat-number">{formatNumber(animDiag)}</h2>
                            <span className="stat-trend positive">✓ OK</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Secondary Content Grid */}
            <div className="dashboard-grid anim-fade-in" style={{ animationDelay: '0.4s' }}>
                {/* Recent Items Panel */}
                <div className="panel-luxury">
                    <div className="panel-header">
                        <div className="panel-title">
                            <span className="title-icon"><HiOutlineDesktopComputer size={20} /></span>
                            <h2>Équipements Récents</h2>
                        </div>
                        <button className="panel-action" onClick={() => navigate('/equipments')}>Voir tout</button>
                    </div>
                    <div className="equipment-luxury-list">
                        {equipments.length === 0 ? (
                            <div className="list-empty">Chargement des données...</div>
                        ) : (
                            equipments.map((eq, idx) => (
                                <div key={eq.id} className="eq-item-luxury anim-slide-right" style={{ animationDelay: `${0.5 + idx * 0.1}s` }} onClick={() => navigate('/equipments')}>
                                    <div className="eq-info-main">
                                        <div className="eq-avatar"><HiOutlineDesktopComputer size={24} /></div>
                                        <div className="eq-text">
                                            <h3>{eq.name}</h3>
                                            <div className="eq-subtext">
                                                <span className={`badge-status ${eq.status}`}>{eq.statusLabel}</span>
                                                <span className="separator">•</span>
                                                <span className="ref-text">ID: {eq.ref}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="eq-info-side">
                                        <span className="side-label">{eq.info}</span>
                                        <span className="side-value">{eq.date}</span>
                                    </div>
                                    <div className="eq-arrow">›</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Activity Feed Panel */}
                <div className="panel-luxury">
                    <div className="panel-header">
                        <div className="panel-title">
                            <span className="title-icon"><HiOutlineClock size={20} /></span>
                            <h2>Activité Récente</h2>
                        </div>
                        <div className="live-status">
                            <span className="live-pulse"></span> En direct
                        </div>
                    </div>
                    <div className="activity-luxury-list">
                        {recentActivities.length === 0 ? (
                            <div className="list-empty">Pas d'activité récente.</div>
                        ) : (
                            recentActivities.map((act, idx) => (
                                <div key={act.id} className="act-item-luxury anim-slide-right" style={{ animationDelay: `${0.5 + idx * 0.1}s` }} onClick={() => navigate('/interventions')}>
                                    <div className="act-icon-wrap" style={{ backgroundColor: act.iconBg, color: act.iconColor }}>
                                        {act.icon}
                                    </div>
                                    <div className="act-content">
                                        <h3>{act.title}</h3>
                                        <p>{act.desc}</p>
                                        <div className="act-meta">
                                            <span className={`act-tag ${act.tagCls}`}>{act.tag}</span>
                                            <span className="act-time">{act.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

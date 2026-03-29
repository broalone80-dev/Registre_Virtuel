import { useState, useEffect, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePencil, HiOutlinePlusCircle, HiOutlineX } from 'react-icons/hi'
import { HiOutlineBuildingOffice2, HiOutlineCheckCircle, HiOutlineArchiveBox, HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi2'
import './AgenciesPage.css'

export default function AgenciesPage() {
    const api = useApi()
    const [agencies, setAgencies] = useState([
        { id: 'ag1', code: 'DLA-C', name: 'Douala Centre', city: 'Douala', region: 'Littoral', address: '15 Rue Joss, Douala', phone: '+237 233 42 00 00', email: 'douala.centre@expressunion.cm', is_active: true, max_daily_appointments: 25, equipments_count: 12 },
        { id: 'ag2', code: 'YDE-N', name: 'Yaoundé Nord', city: 'Yaoundé', region: 'Centre', address: '45 Av. Kennedy, Yaoundé', phone: '+237 222 23 00 00', email: 'yaounde.nord@expressunion.cm', is_active: true, max_daily_appointments: 20, equipments_count: 8 },
        { id: 'ag3', code: 'BFS', name: 'Bafoussam', city: 'Bafoussam', region: 'Ouest', address: '12 Rue du Marché, Bafoussam', phone: '+237 233 44 00 00', email: 'bafoussam@expressunion.cm', is_active: true, max_daily_appointments: 15, equipments_count: 5 },
        { id: 'ag4', code: 'BDA', name: 'Bamenda', city: 'Bamenda', region: 'Nord-Ouest', address: '8 Commercial Ave, Bamenda', phone: '+237 233 36 00 00', email: 'bamenda@expressunion.cm', is_active: true, max_daily_appointments: 15, equipments_count: 3 },
        { id: 'ag5', code: 'GRA', name: 'Garoua', city: 'Garoua', region: 'Nord', address: '20 Rue Centrale, Garoua', phone: '+237 222 27 00 00', email: 'garoua@expressunion.cm', is_active: false, max_daily_appointments: 10, equipments_count: 0 }
    ])

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [formData, setFormData] = useState({
        code: '', name: '', city: '', region: '', address: '', phone: '', email: '', max_daily_appointments: 20
    })

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/agencies')
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    setAgencies(res.data)
                }
            } catch {
                console.log('Agencies: API indisponible, données de démo')
            }
        }
        load()
    }, [])

    const filteredAgencies = useMemo(() => {
        return agencies.filter(a => {
            return !searchQuery ||
                (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.city || '').toLowerCase().includes(searchQuery.toLowerCase())
        })
    }, [agencies, searchQuery])

    const openCreate = () => {
        setFormData({ code: '', name: '', city: '', region: '', address: '', phone: '', email: '', max_daily_appointments: 20 })
        setEditingId(null)
        setShowModal(true)
    }

    const openEdit = (agency) => {
        setFormData({
            code: agency.code || '', name: agency.name || '', city: agency.city || '',
            region: agency.region || '', address: agency.address || '', phone: agency.phone || '',
            email: agency.email || '', max_daily_appointments: agency.max_daily_appointments || 20
        })
        setEditingId(agency.id)
        setShowModal(true)
    }

    const toggleActive = async (id) => {
        const agency = agencies.find(a => a.id === id)
        if (!agency) return
        try { await api.patch(`/agencies/${id}`, { is_active: !agency.is_active }) } catch { /* ignore */ }
        setAgencies(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (editingId) {
            try { await api.put(`/agencies/${editingId}`, formData) } catch { /* ignore */ }
            setAgencies(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } : a))
        } else {
            try {
                const res = await api.post('/agencies', formData)
                if (res?.data?.id) { setAgencies(prev => [res.data, ...prev]); setShowModal(false); return }
            } catch { /* fallback */ }
            const newId = `ag-${Date.now()}`
            setAgencies(prev => [{ id: newId, ...formData, is_active: true, equipments_count: 0 }, ...prev])
        }
        setShowModal(false)
    }

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    // Stats for agencies
    const stats = useMemo(() => {
        return {
            total: agencies.length,
            active: agencies.filter(a => a.is_active).length,
            equipments: agencies.reduce((acc, a) => acc + (a.equipments_count || 0), 0)
        }
    }, [agencies])

    return (
        <div className="agencies-page anim-fade-in">
            {/* Top Bar with Breadcrumbs */}
            <div className="dashboard-topbar">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Gestion des Agences</span>
                </div>
                <div className="topbar-actions">
                    <button onClick={openCreate} className="topbar-btn-add">
                        <span><HiOutlinePlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Nouvelle agence</span>
                    </button>
                </div>
            </div>

            {/* Title Section */}
            <div className="dashboard-title-section anim-slide-right">
                <h1 className="dashboard-title"><HiOutlineBuildingOffice2 size={32} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Réseau d'Agences</h1>
                <p className="dashboard-subtitle">
                    Gestion du réseau Express Union — {stats.active} agences opérationnelles sur {stats.total}
                </p>
            </div>

            {/* Stats Row */}
            <div className="dash-stats-row anim-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue"><HiOutlineBuildingOffice2 size={22} /></div>
                        <div className="dash-stat-badge stable">RESEAU</div>
                    </div>
                    <p className="dash-stat-label">Agences</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.total}</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green"><HiOutlineCheckCircle size={22} /></div>
                        <div className="dash-stat-badge stable">ACTIF</div>
                    </div>
                    <p className="dash-stat-label">Opérationnelles</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.active}</span>
                        <span className="dash-stat-sub positive">OK</span>
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon orange"><HiOutlineArchiveBox size={22} /></div>
                        <div className="dash-stat-badge action">INVENTAIRE</div>
                    </div>
                    <p className="dash-stat-label">Équipements</p>
                    <div className="dash-stat-bottom">
                        <span className="dash-stat-value">{stats.equipments}</span>
                        <span className="dash-stat-sub">Total</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section anim-slide-up">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Recherche</label>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom, code, ville..." className="form-input" />
                    </div>
                </div>
            </div>

            {/* Agencies Grid */}
            <div className="agencies-grid anim-slide-up">
                {filteredAgencies.map(agency => (
                    <div key={agency.id} className={`agency-card ${!agency.is_active ? 'inactive' : ''}`}>
                        <div className="agency-header">
                            <div>
                                <span className="agency-code">{agency.code}</span>
                                <h3 className="agency-name">{agency.name}</h3>
                            </div>
                            <span className={`status-badge ${agency.is_active ? 'status-completed' : 'status-cancelled'}`}>
                                {agency.is_active ? <><HiOutlineCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Active</> : <><HiOutlineX size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Inactive</>}
                            </span>
                        </div>
                        <div className="agency-body">
                            <p className="agency-info-row"><HiOutlineMapPin size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {agency.city}, {agency.region}</p>
                            <p className="agency-info-row"><HiOutlinePhone size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {agency.phone || 'N/A'}</p>
                            <p className="agency-info-row"><HiOutlineEnvelope size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {agency.email || 'N/A'}</p>
                            <p className="agency-info-row"><HiOutlineArchiveBox size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {agency.equipments_count ?? 0} équipements déposés</p>
                        </div>
                        <div className="agency-footer">
                            <button onClick={() => openEdit(agency)} className="action-btn"><HiOutlinePencil size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Éditer</button>
                            <button onClick={() => toggleActive(agency.id)} className="action-btn">
                                {agency.is_active ? <><HiOutlineLockClosed size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Désactiver</> : <><HiOutlineLockOpen size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Activer</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAgencies.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon"><HiOutlineBuildingOffice2 size={40} /></div>
                    <h3>Aucune agence trouvée</h3>
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
                                <h2 className="modal-title">
                                    {editingId ? <HiOutlinePencil size={20} style={{ marginRight: 8 }} /> : <HiOutlinePlusCircle size={20} style={{ marginRight: 8 }} />}
                                    {editingId ? 'Modifier l\'agence' : 'Nouvelle Agence'}
                                </h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <HiOutlineX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="premium-modal-body">
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Code Agence</label>
                                            <input value={formData.code} onChange={(e) => updateField('code', e.target.value)} placeholder="Ex: DLA-C" className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nom de l'agence</label>
                                            <input value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Douala Centre" className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Ville</label>
                                            <input value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Ex: Douala" className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Région</label>
                                            <input value={formData.region} onChange={(e) => updateField('region', e.target.value)} placeholder="Ex: Littoral" className="form-input" />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '15px' }}>
                                        <label className="form-label">Adresse complète</label>
                                        <input value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Rue, quartier..." className="form-input" />
                                    </div>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Téléphone</label>
                                            <input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+237..." className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email de contact</label>
                                            <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="agence@expressunion.cm" className="form-input" />
                                        </div>
                                    </div>
                                </div>

                                <div className="premium-modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                                    <button type="submit" className="btn-primary">
                                        {editingId ? 'Enregistrer les modifications' : 'Créer l\'agence'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

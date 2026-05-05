import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { AnimatePresence } from 'framer-motion'
import { HiOutlineDesktopComputer, HiOutlineSparkles, HiOutlineX } from 'react-icons/hi'
import {
    HiOutlineArchiveBox, HiOutlineExclamationTriangle,
    HiOutlineMagnifyingGlass, HiOutlineUserCircle,
    HiOutlineBoltSlash
} from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
import PreDiagnosticPanel from '../components/PreDiagnosticPanel'
import ConfirmationCard from '../components/depot/ConfirmationCard'
import EquipmentSearchDropdown from '../components/depot/EquipmentSearchDropdown'
import AIDiagnosticPhase from '../components/depot/AIDiagnosticPhase'
import './DepotPage.css'

const EQUIPMENT_TYPES = [
    'Ordinateur portable', 'Ordinateur de bureau', 'Imprimante',
    'Scanner', 'Routeur/Switch', 'Onduleur (UPS)', 'Écran/Moniteur',
    'Tablette', 'Téléphone IP', 'Autre'
]

const BRANDS = [
    'Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple', 'Samsung',
    'Toshiba', 'MSI', 'Canon', 'Epson', 'Brother', 'Cisco', 'Autre'
]

export default function DepotPage() {
    const api = useApi()
    const user = useAuthStore((s) => s.user)

    // Étapes : 'form' | 'ai_diagnostic' | 'confirm'
    const [phase, setPhase] = useState('form')
    const [submitting, setSubmitting] = useState(false)
    const [lastRef, setLastRef] = useState('')

    // Équipement existant
    const [equipmentMode, setEquipmentMode] = useState('new')
    const [equipmentSearch, setEquipmentSearch] = useState('')
    const [equipmentResults, setEquipmentResults] = useState([])
    const [selectedEquipment, setSelectedEquipment] = useState(null)
    const [searchingEquipment, setSearchingEquipment] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [recentEquipments, setRecentEquipments] = useState([])

    // Déposant
    const [depositorSearch, setDepositorSearch] = useState('')
    const [depositorResults, setDepositorResults] = useState([])
    const [selectedDepositor, setSelectedDepositor] = useState(null)
    const [searchingDepositor, setSearchingDepositor] = useState(false)

    const [formData, setFormData] = useState({
        equipment_type: 'Ordinateur portable',
        brand: 'Dell',
        model: '',
        serial_number: '',
        problem_description: '',
        priority: 'normal',
        depositor_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
        depositor_phone: user?.phone || '',
        accessories: ''
    })

    // IA Diagnostic interactif
    const [aiLoading, setAiLoading] = useState(false)
    const [aiData, setAiData] = useState(null)
    const [aiCurrentStep, setAiCurrentStep] = useState(0)
    const [aiAnswers, setAiAnswers] = useState([])
    const [aiComplete, setAiComplete] = useState(false)
    const [aiFinalResult, setAiFinalResult] = useState(null)
    const [aiDecision, setAiDecision] = useState(null) // 'self_fix' | 'depot'

    // Pré-diagnostic rapide IA (nouveau)
    const [showPreDiag, setShowPreDiag] = useState(false)

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    // Charger les équipements récents au montage
    useEffect(() => {
        const loadRecent = async () => {
            try {
                const agencyFilter = user?.agency_id ? `&agency_id=${user.agency_id}` : ''
                const res = await api.get(`/equipments?limit=8&sortBy=received_at&sortOrder=DESC${agencyFilter}`)
                if (res?.data && Array.isArray(res.data)) {
                    setRecentEquipments(res.data)
                }
            } catch { /* silently fail */ }
        }
        loadRecent()
    }, []) // eslint-disable-line

    // ─── Recherche équipement ───
    const searchEquipments = async (query) => {
        setEquipmentSearch(query)
        if (query.length < 2) {
            setEquipmentResults([])
            return
        }
        setSearchingEquipment(true)
        try {
            const res = await api.get(`/equipments?search=${encodeURIComponent(query)}&limit=8`)
            if (res?.data && Array.isArray(res.data)) {
                setEquipmentResults(res.data)
            }
        } catch {
            setEquipmentResults([])
        } finally {
            setSearchingEquipment(false)
        }
    }

    const selectEquipment = (eq) => {
        setSelectedEquipment(eq)
        setEquipmentMode('existing')
        setFormData(prev => ({
            ...prev,
            equipment_type: eq.type?.name || 'Autre',
            brand: eq.brand || 'Autre',
            model: eq.model || '',
            serial_number: eq.serial_number || ''
        }))
        setEquipmentSearch('')
        setEquipmentResults([])
        setShowDropdown(false)
    }

    const clearEquipment = () => {
        setSelectedEquipment(null)
        setEquipmentMode('new')
        setFormData(prev => ({
            ...prev, equipment_type: 'Ordinateur portable', brand: 'Dell', model: '', serial_number: ''
        }))
    }

    // ─── Recherche dépositaire ───
    const searchDepositors = async (query) => {
        setDepositorSearch(query)
        if (query.length < 2) { setDepositorResults([]); return }
        setSearchingDepositor(true)
        try {
            const res = await api.get(`/depositors?search=${encodeURIComponent(query)}&limit=5`)
            if (res?.data && Array.isArray(res.data)) setDepositorResults(res.data)
        } catch { setDepositorResults([]) }
        finally { setSearchingDepositor(false) }
    }

    const selectDepositor = (dep) => {
        setSelectedDepositor(dep)
        setFormData(prev => ({
            ...prev,
            depositor_name: `${dep.first_name} ${dep.last_name}`,
            depositor_phone: dep.phone || ''
        }))
        setDepositorSearch('')
        setDepositorResults([])
    }

    const clearDepositor = () => {
        setSelectedDepositor(null)
        setFormData(prev => ({ ...prev, depositor_name: '', depositor_phone: '' }))
    }

    // ─── IA Diagnostic ───
    const startAIDiagnostic = async () => {
        if (!formData.problem_description.trim()) {
            toast.error('Décrivez le problème avant de lancer le diagnostic')
            return
        }
        setPhase('ai_diagnostic')
        setAiLoading(true)
        setAiData(null)
        setAiCurrentStep(0)
        setAiAnswers([])
        setAiComplete(false)
        setAiFinalResult(null)
        setAiDecision(null)
        try {
            const res = await api.post('/ai/analyze', {
                description: formData.problem_description,
                equipmentId: selectedEquipment?.id || null
            })
            if (res?.data) setAiData(res.data)
        } catch {
            toast.error('Erreur lors de l\'analyse IA')
            setPhase('form')
        } finally {
            setAiLoading(false)
        }
    }

    const handleAIAnswer = async (answer) => {
        if (!aiData) return
        setAiLoading(true)
        try {
            const res = await api.post('/ai/answer', {
                problemType: aiData.problemType,
                stepIndex: aiCurrentStep,
                answer,
                previousAnswers: aiAnswers
            })
            if (res?.data) {
                setAiAnswers(prev => [...prev, { step: aiCurrentStep, answer }])
                if (res.data.isComplete) {
                    setAiComplete(true)
                    setAiFinalResult(res.data)
                } else {
                    setAiCurrentStep(res.data.nextStepIndex)
                }
            }
        } catch {
            toast.error('Erreur lors du diagnostic')
        } finally {
            setAiLoading(false)
        }
    }

    const resetAI = () => {
        setAiData(null)
        setAiCurrentStep(0)
        setAiAnswers([])
        setAiComplete(false)
        setAiFinalResult(null)
        setAiDecision(null)
        setShowPreDiag(false)
    }

    // Gestion décision pré-diagnostic rapide
    const handlePreDiagDecision = (decision) => {
        if (decision === 'self_fix') {
            setShowPreDiag(false)
            toast.success('Appliquez les solutions rapides suggérées. Si le problème persiste, revenez pour créer un dépôt.')
        } else if (decision === 'depot') {
            setShowPreDiag(false)
            handleSubmit()
        }
    }

    // ─── Soumission ───
    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            if (equipmentMode === 'existing' && selectedEquipment) {
                await api.put(`/equipments/${selectedEquipment.id}`, {
                    problem_description: formData.problem_description,
                    priority: formData.priority,
                    accessories: formData.accessories || null,
                    ...(selectedDepositor ? { depositor_id: selectedDepositor.id }
                        : formData.depositor_name ? { depositor_name: formData.depositor_name, depositor_phone: formData.depositor_phone || '' } : {})
                })
                try { await api.patch(`/equipments/${selectedEquipment.id}/status`, { status: 'received' }) } catch { }
                setLastRef(selectedEquipment.reference || `DEP-${selectedEquipment.id.substring(0, 8)}`)
                setPhase('confirm')
            } else {
                const payload = {
                    equipment_type: formData.equipment_type,
                    brand: formData.brand,
                    model: formData.model,
                    serial_number: formData.serial_number,
                    problem_description: formData.problem_description,
                    priority: formData.priority,
                    agency_id: user?.agency_id,
                    accessories: formData.accessories || null,
                    ...(selectedDepositor ? { depositor_id: selectedDepositor.id }
                        : { depositor_name: formData.depositor_name, depositor_phone: formData.depositor_phone || '' })
                }
                const res = await api.post('/equipments', payload)
                if (res?.success !== false && res?.data) {
                    setLastRef(res.data.reference || `DEP-${Date.now()}`)
                    setPhase('confirm')
                } else {
                    toast.error(res?.message || 'Erreur lors de l\'enregistrement')
                }
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors du dépôt')
        }
        setSubmitting(false)
    }

    const resetAll = () => {
        setFormData({
            equipment_type: 'Ordinateur portable', brand: 'Dell', model: '',
            serial_number: '', problem_description: '', priority: 'normal',
            depositor_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
            depositor_phone: user?.phone || '',
            accessories: ''
        })
        setSelectedDepositor(null)
        setSelectedEquipment(null)
        setEquipmentMode('new')
        resetAI()
        setPhase('form')
    }

    // ════════════════════════════════════════
    //  PHASE: CONFIRMATION
    // ════════════════════════════════════════
    if (phase === 'confirm') {
        return (
            <div className="depot-page">
                <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' } }} />
                <ConfirmationCard lastRef={lastRef} formData={formData} onReset={resetAll} />
            </div>
        )
    }

    // ════════════════════════════════════════
    //  PHASE: DIAGNOSTIC IA INTERACTIF
    // ════════════════════════════════════════
    if (phase === 'ai_diagnostic') {
        return (
            <AIDiagnosticPhase
                formData={formData}
                aiData={aiData}
                aiLoading={aiLoading}
                aiCurrentStep={aiCurrentStep}
                aiAnswers={aiAnswers}
                aiComplete={aiComplete}
                aiFinalResult={aiFinalResult}
                aiDecision={aiDecision}
                submitting={submitting}
                onAnswer={handleAIAnswer}
                onSetDecision={setAiDecision}
                onSubmit={handleSubmit}
                onResetAndBack={() => { resetAI(); setPhase('form') }}
            />
        )
    }

    // Données à afficher dans le dropdown
    const dropdownItems = equipmentSearch.length >= 2
        ? equipmentResults
        : recentEquipments

    // ════════════════════════════════════════
    //  PHASE: FORMULAIRE PRINCIPAL
    // ════════════════════════════════════════
    return (
        <div className="depot-page">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' } }} />

            <div className="depot-header">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">Plateforme</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-item current">Dépôt</span>
                </div>
                <h1 className="depot-title">
                    <HiOutlineArchiveBox size={28} /> Dépôt d'équipement
                </h1>
                <p className="depot-subtitle">Signaler un problème sur un équipement existant ou enregistrer un nouvel appareil</p>
            </div>

            <div className="depot-form-card">
                {/* ─── Section 1: Équipement ─── */}
                <div className="depot-section">
                    <h3 className="depot-section-title">
                        <HiOutlineDesktopComputer size={18} /> Équipement concerné
                    </h3>

                    <EquipmentSearchDropdown
                        equipmentSearch={equipmentSearch}
                        onSearch={searchEquipments}
                        onSelect={selectEquipment}
                        onClear={clearEquipment}
                        selectedEquipment={selectedEquipment}
                        searchingEquipment={searchingEquipment}
                        equipmentResults={equipmentResults}
                        recentEquipments={recentEquipments}
                        showDropdown={showDropdown}
                        setShowDropdown={setShowDropdown}
                    />

                    {/* Formulaire nouvel équipement */}
                    {!selectedEquipment && equipmentMode === 'new' && (
                        <div className="new-equipment-fields">
                            <div className="field-row">
                                <div className="field">
                                    <label>Type</label>
                                    <select value={formData.equipment_type} onChange={(e) => updateField('equipment_type', e.target.value)} className="form-input">
                                        {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Marque</label>
                                    <select value={formData.brand} onChange={(e) => updateField('brand', e.target.value)} className="form-input">
                                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="field-row">
                                <div className="field">
                                    <label>Modèle</label>
                                    <input type="text" value={formData.model} onChange={(e) => updateField('model', e.target.value)} placeholder="Ex: Inspiron 15 3520" className="form-input" required />
                                </div>
                                <div className="field">
                                    <label>N° Série <span className="optional">(optionnel)</span></label>
                                    <input type="text" value={formData.serial_number} onChange={(e) => updateField('serial_number', e.target.value)} placeholder="S/N ou TAG" className="form-input" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Section 2: Problème ─── */}
                <div className="depot-section">
                    <h3 className="depot-section-title">
                        <HiOutlineExclamationTriangle size={18} /> Description du problème
                    </h3>
                    <div className="field">
                        <textarea
                            value={formData.problem_description}
                            onChange={(e) => updateField('problem_description', e.target.value)}
                            placeholder="Décrivez le problème en détail : quand est-il apparu, que se passe-t-il exactement..."
                            className="form-textarea"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Urgence</label>
                            <select value={formData.priority} onChange={(e) => updateField('priority', e.target.value)} className="form-input">
                                <option value="low">Bas — Peut attendre</option>
                                <option value="normal">Normal</option>
                                <option value="high">Urgent</option>
                                <option value="urgent">Critique — Bloque l'agence</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Accessoires <span className="optional">(optionnel)</span></label>
                            <input type="text" value={formData.accessories} onChange={(e) => updateField('accessories', e.target.value)} placeholder="Chargeur, souris, câble..." className="form-input" />
                        </div>
                    </div>
                </div>

                {/* ─── Section 3: Déposant ─── */}
                <div className="depot-section">
                    <h3 className="depot-section-title">
                        <HiOutlineUserCircle size={18} /> Déposant
                    </h3>

                    {selectedDepositor ? (
                        <div className="selected-item-card">
                            <div className="selected-item-info">
                                <HiOutlineUserCircle size={24} className="selected-item-icon" />
                                <div>
                                    <strong>{selectedDepositor.first_name} {selectedDepositor.last_name}</strong>
                                    <span>{selectedDepositor.phone || 'Pas de téléphone'} • {selectedDepositor.email || 'Pas d\'email'}</span>
                                </div>
                            </div>
                            <button type="button" onClick={clearDepositor} className="btn-clear">
                                <HiOutlineX size={16} /> Changer
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="search-bar" style={{ marginBottom: 12 }}>
                                <HiOutlineMagnifyingGlass size={18} className="search-bar-icon" />
                                <input
                                    type="text"
                                    value={depositorSearch}
                                    onChange={(e) => searchDepositors(e.target.value)}
                                    placeholder="Rechercher un déposant existant..."
                                    className="form-input"
                                />
                                {searchingDepositor && <span className="search-spinner">⏳</span>}
                            </div>
                            {depositorResults.length > 0 && (
                                <div className="depositor-dropdown">
                                    {depositorResults.map(dep => (
                                        <div key={dep.id} className="dropdown-item" onClick={() => selectDepositor(dep)}>
                                            <HiOutlineUserCircle size={16} className="dropdown-item-icon" />
                                            <div className="dropdown-item-text">
                                                <strong>{dep.first_name} {dep.last_name}</strong>
                                                <span>{dep.phone || 'N/A'} • {dep.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="separator-text">— ou nouveau déposant —</p>
                            <div className="field-row">
                                <div className="field">
                                    <label>Nom complet</label>
                                    <input type="text" value={formData.depositor_name} onChange={(e) => updateField('depositor_name', e.target.value)} placeholder="Nom et prénom" className="form-input" />
                                </div>
                                <div className="field">
                                    <label>Téléphone</label>
                                    <input type="tel" value={formData.depositor_phone} onChange={(e) => updateField('depositor_phone', e.target.value)} placeholder="+237 6XX XXX XXX" className="form-input" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ─── Actions ─── */}
                <div className="depot-actions">
                    <button
                        className="btn-prediag-quick"
                        onClick={() => {
                            if (!formData.problem_description.trim()) {
                                toast.error('Décrivez le problème avant de lancer le pré-diagnostic')
                                return
                            }
                            setShowPreDiag(true)
                        }}
                        disabled={!formData.problem_description.trim() || showPreDiag}
                        type="button"
                        title="Pré-diagnostic rapide : sévérité, recommandation, solutions rapides"
                    >
                        <HiOutlineBoltSlash size={18} /> Pré-diagnostic rapide
                    </button>
                    <button
                        className="btn-ai-launch"
                        onClick={startAIDiagnostic}
                        disabled={!formData.problem_description.trim()}
                        type="button"
                    >
                        <HiOutlineSparkles size={18} /> Diagnostic IA interactif
                    </button>
                    <button
                        className="btn-submit-depot"
                        onClick={handleSubmit}
                        disabled={submitting || !formData.problem_description.trim()}
                        type="button"
                    >
                        {submitting ? 'Enregistrement...' : (
                            <><HiOutlineArchiveBox size={18} /> Enregistrer le dépôt directement</>
                        )}
                    </button>
                </div>

                {/* Pré-diagnostic rapide IA */}
                <AnimatePresence>
                    {showPreDiag && formData.problem_description.trim() && (
                        <PreDiagnosticPanel
                            description={formData.problem_description}
                            context={{
                                equipment_type: formData.equipment_type,
                                brand: formData.brand,
                                model: formData.model,
                                equipment_id: selectedEquipment?.id || null
                            }}
                            onDecision={handlePreDiagDecision}
                            onClose={() => setShowPreDiag(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

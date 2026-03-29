import { useState, useEffect, useRef } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineDesktopComputer, HiOutlineSparkles, HiOutlineX } from 'react-icons/hi'
import {
    HiOutlineArchiveBox, HiOutlineExclamationTriangle, HiOutlineCheckCircle,
    HiOutlineMagnifyingGlass, HiOutlineWrenchScrewdriver, HiOutlineUserCircle,
    HiOutlineChatBubbleBottomCenterText, HiOutlineLightBulb,
    HiOutlineArrowPath, HiOutlineCpuChip, HiOutlineHandRaised
} from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
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
    const searchRef = useRef(null)

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
        depositor_name: '',
        depositor_phone: '',
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
    const chatEndRef = useRef(null)

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

    // Auto-scroll le chat IA
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [aiAnswers, aiData, aiComplete])

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
            depositor_name: '', depositor_phone: '', accessories: ''
        })
        setSelectedDepositor(null)
        setSelectedEquipment(null)
        setEquipmentMode('new')
        resetAI()
        setPhase('form')
    }

    // Fermer le dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Données à afficher dans le dropdown
    const dropdownItems = equipmentSearch.length >= 2
        ? equipmentResults
        : recentEquipments

    // ════════════════════════════════════════
    //  PHASE: CONFIRMATION
    // ════════════════════════════════════════
    if (phase === 'confirm') {
        return (
            <div className="depot-page">
                <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' } }} />
                <motion.div className="confirmation-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="confirm-icon"><HiOutlineCheckCircle size={56} color="#10b981" /></div>
                    <h2 className="confirm-title">Dépôt enregistré</h2>
                    <p className="confirm-text">L'équipement a été transmis au service maintenance.</p>
                    <div className="confirm-ref">
                        <span className="confirm-ref-label">Référence de suivi</span>
                        <span className="confirm-ref-value">{lastRef}</span>
                    </div>
                    <div className="confirm-details">
                        <p><strong>Équipement :</strong> {formData.brand} {formData.model}</p>
                        <p><strong>Problème :</strong> {formData.problem_description}</p>
                        {formData.depositor_name && <p><strong>Déposant :</strong> {formData.depositor_name}</p>}
                    </div>
                    <button onClick={resetAll} className="btn-primary">
                        <HiOutlineArchiveBox size={18} /> Nouveau dépôt
                    </button>
                </motion.div>
            </div>
        )
    }

    // ════════════════════════════════════════
    //  PHASE: DIAGNOSTIC IA INTERACTIF
    // ════════════════════════════════════════
    if (phase === 'ai_diagnostic') {
        return (
            <div className="depot-page">
                <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' } }} />

                <div className="ai-diagnostic-container">
                    <div className="ai-header">
                        <div className="ai-header-icon"><HiOutlineCpuChip size={28} /></div>
                        <div>
                            <h2>Diagnostic interactif</h2>
                            <p>L'assistant analyse le problème avec vous avant de décider du dépôt</p>
                        </div>
                        <button className="btn-back-form" onClick={() => { resetAI(); setPhase('form') }}>
                            <HiOutlineX size={18} /> Retour
                        </button>
                    </div>

                    {/* Contexte */}
                    <div className="ai-context-bar">
                        <span><HiOutlineDesktopComputer size={16} /> {formData.brand} {formData.model || formData.equipment_type}</span>
                        <span className="ai-separator">•</span>
                        <span className="ai-problem-preview">{formData.problem_description.substring(0, 80)}{formData.problem_description.length > 80 ? '...' : ''}</span>
                    </div>

                    {/* Chat IA */}
                    <div className="ai-chat">
                        {/* Message initial IA */}
                        {aiData && (
                            <motion.div className="ai-msg ai-msg-bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="ai-msg-avatar"><HiOutlineCpuChip size={18} /></div>
                                <div className="ai-msg-content">
                                    <p>J'ai identifié un problème de type <strong>{aiData.problemType}</strong> (maintenance {aiData.maintenanceType}). Je vais vous poser quelques questions pour analyser la situation.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Questions / Réponses */}
                        {aiData?.steps?.map((step, i) => {
                            if (i > aiCurrentStep && !aiAnswers.find(a => a.step === i)) return null
                            const answered = aiAnswers.find(a => a.step === i)
                            return (
                                <div key={i}>
                                    <motion.div className="ai-msg ai-msg-bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <div className="ai-msg-avatar"><HiOutlineCpuChip size={18} /></div>
                                        <div className="ai-msg-content">
                                            <p className="ai-question">{step.question}</p>
                                            {!answered && i === aiCurrentStep && !aiLoading && (
                                                <div className="ai-options">
                                                    {step.options.map((opt, j) => (
                                                        <button key={j} className="ai-option-btn" onClick={() => handleAIAnswer(opt)}>
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                    {answered && (
                                        <motion.div className="ai-msg ai-msg-user" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="ai-msg-content"><p>{answered.answer}</p></div>
                                            <div className="ai-msg-avatar ai-avatar-user"><HiOutlineUserCircle size={18} /></div>
                                        </motion.div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Loading */}
                        {aiLoading && (
                            <div className="ai-msg ai-msg-bot">
                                <div className="ai-msg-avatar"><HiOutlineCpuChip size={18} /></div>
                                <div className="ai-msg-content"><div className="ai-typing"><span></span><span></span><span></span></div></div>
                            </div>
                        )}

                        {/* Résultat final */}
                        {aiComplete && aiFinalResult && !aiDecision && (
                            <motion.div className="ai-result-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                                <h3><HiOutlineLightBulb size={20} /> Analyse terminée</h3>
                                <p className="ai-result-summary">{aiFinalResult.finalSummary}</p>

                                {aiFinalResult.recommendedActions?.length > 0 && (
                                    <div className="ai-actions-list">
                                        <h4>Actions recommandées :</h4>
                                        <ul>
                                            {aiFinalResult.recommendedActions.map((action, i) => (
                                                <li key={i}><HiOutlineWrenchScrewdriver size={14} /> {action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="ai-decision-section">
                                    <p className="ai-decision-question">Souhaitez-vous essayer de résoudre le problème vous-même ou transmettre au maintenancier ?</p>
                                    <div className="ai-decision-btns">
                                        <button className="ai-decision-btn self-fix" onClick={() => setAiDecision('self_fix')}>
                                            <HiOutlineHandRaised size={20} />
                                            <span>Je gère moi-même</span>
                                            <small>Suivre les actions ci-dessus</small>
                                        </button>
                                        <button className="ai-decision-btn depot" onClick={() => setAiDecision('depot')}>
                                            <HiOutlineArchiveBox size={20} />
                                            <span>Envoyer au maintenancier</span>
                                            <small>Créer un dépôt officiel</small>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Décision: Self fix */}
                        {aiDecision === 'self_fix' && (
                            <motion.div className="ai-result-card ai-self-fix-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                                <h3><HiOutlineCheckCircle size={20} color="#10b981" /> Bonne chance !</h3>
                                <p>Suivez les étapes recommandées. Si le problème persiste, vous pourrez toujours créer un dépôt.</p>
                                <div className="ai-decision-btns">
                                    <button className="btn-primary" onClick={() => { resetAI(); setPhase('form') }}>
                                        <HiOutlineArrowPath size={16} /> Retour au formulaire
                                    </button>
                                    <button className="btn-secondary" onClick={() => setAiDecision('depot')}>
                                        Finalement, créer le dépôt
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Décision: Dépôt */}
                        {aiDecision === 'depot' && (
                            <motion.div className="ai-result-card ai-depot-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                                <h3><HiOutlineArchiveBox size={20} color="#3b82f6" /> Création du dépôt</h3>
                                <p>Le diagnostic sera joint au dépôt pour aider le maintenancier.</p>
                                <button
                                    className="btn-primary btn-depot-final"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Enregistrement...' : (
                                        <><HiOutlineArchiveBox size={18} /> Confirmer le dépôt</>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>
        )
    }

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

                    {selectedEquipment ? (
                        <div className="selected-item-card">
                            <div className="selected-item-info">
                                <HiOutlineDesktopComputer size={24} className="selected-item-icon" />
                                <div>
                                    <strong>{selectedEquipment.brand} {selectedEquipment.model}</strong>
                                    <span>{selectedEquipment.reference} • {selectedEquipment.type?.name || 'N/A'} • S/N: {selectedEquipment.serial_number || 'N/A'}</span>
                                </div>
                            </div>
                            <button type="button" onClick={clearEquipment} className="btn-clear">
                                <HiOutlineX size={16} /> Changer
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Barre de recherche avec dropdown */}
                            <div className="equipment-search-container" ref={searchRef}>
                                <div className="search-bar">
                                    <HiOutlineMagnifyingGlass size={18} className="search-bar-icon" />
                                    <input
                                        type="text"
                                        value={equipmentSearch}
                                        onChange={(e) => searchEquipments(e.target.value)}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Rechercher un équipement du parc (marque, modèle, réf)..."
                                        className="form-input"
                                    />
                                    {searchingEquipment && <span className="search-spinner">⏳</span>}
                                </div>

                                <AnimatePresence>
                                    {showDropdown && (dropdownItems.length > 0 || equipmentSearch.length >= 2) && (
                                        <motion.div
                                            className="equipment-dropdown"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                        >
                                            {equipmentSearch.length < 2 && recentEquipments.length > 0 && (
                                                <div className="dropdown-label">
                                                    <HiOutlineLightBulb size={14} /> Équipements récents de votre agence
                                                </div>
                                            )}
                                            {dropdownItems.map(eq => (
                                                <div key={eq.id} className="dropdown-item" onClick={() => selectEquipment(eq)}>
                                                    <HiOutlineDesktopComputer size={16} className="dropdown-item-icon" />
                                                    <div className="dropdown-item-text">
                                                        <strong>{eq.brand} {eq.model || ''}</strong>
                                                        <span>{eq.reference} • {eq.type?.name || ''} • {eq.agency?.name || ''}</span>
                                                    </div>
                                                    <span className={`mini-badge status-${eq.status}`}>
                                                        {eq.status === 'received' ? 'Reçu' : eq.status === 'repaired' ? 'Réparé' : eq.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {equipmentSearch.length >= 2 && dropdownItems.length === 0 && !searchingEquipment && (
                                                <div className="dropdown-empty">Aucun résultat — l'appareil sera créé automatiquement</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Formulaire nouvel équipement */}
                            {equipmentMode === 'new' && (
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
                        </>
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
                        className="btn-ai-launch"
                        onClick={startAIDiagnostic}
                        disabled={!formData.problem_description.trim()}
                        type="button"
                    >
                        <HiOutlineSparkles size={18} /> Diagnostic IA avant dépôt
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
            </div>
        </div>
    )
}

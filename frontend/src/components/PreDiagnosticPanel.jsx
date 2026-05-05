import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineSparkles, HiOutlineShieldCheck, HiOutlineExclamationTriangle,
    HiOutlineXCircle, HiOutlineCheckCircle, HiOutlineEye,
    HiOutlineArchiveBox, HiOutlineHandRaised, HiOutlineArrowPath,
    HiOutlineWrenchScrewdriver, HiOutlineLightBulb, HiOutlineCpuChip
} from 'react-icons/hi2'
import './PreDiagnosticPanel.css'

const SEVERITY_CONFIG = {
    low: {
        label: 'Faible',
        icon: HiOutlineShieldCheck,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        description: 'Problème mineur, résolvable rapidement'
    },
    medium: {
        label: 'Moyenne',
        icon: HiOutlineExclamationTriangle,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        description: 'Problème modéré, à surveiller'
    },
    high: {
        label: 'Élevée',
        icon: HiOutlineXCircle,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        description: 'Problème critique, intervention requise'
    }
}

const RECOMMENDATION_CONFIG = {
    no_action: {
        label: 'Pas de dépôt nécessaire',
        icon: HiOutlineCheckCircle,
        color: '#10b981',
        action: 'Appliquer les solutions rapides'
    },
    monitor: {
        label: 'Surveiller après quick fixes',
        icon: HiOutlineEye,
        color: '#f59e0b',
        action: 'Essayer les solutions, déposer si persistant'
    },
    deposit_required: {
        label: 'Dépôt recommandé',
        icon: HiOutlineArchiveBox,
        color: '#ef4444',
        action: 'Transmettre au service technique'
    }
}

/**
 * PreDiagnosticPanel — Panneau de pré-diagnostic IA structuré
 * 
 * Affiche le résultat du pré-diagnostic avec :
 * - Jauge de sévérité (low/medium/high)
 * - Recommandation (no_action/monitor/deposit_required)
 * - Quick fixes actionnables
 * - Résumé technique
 * - Boutons de décision (résoudre soi-même / déposer)
 * 
 * @param {Object} props
 * @param {string} props.description - Description du problème
 * @param {Object} props.context - { equipment_type, brand, model, equipment_id }
 * @param {function} props.onDecision - Callback: onDecision('self_fix' | 'depot')
 * @param {function} props.onClose - Callback pour fermer le panneau
 */
export default function PreDiagnosticPanel({ description, context = {}, onDecision, onClose }) {
    const api = useApi()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showQuickFixes, setShowQuickFixes] = useState(true)

    const runPreDiagnostic = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const res = await api.post('/ai/pre-diagnostic', {
                description,
                equipment_type: context.equipment_type || null,
                brand: context.brand || null,
                model: context.model || null,
                equipment_id: context.equipment_id || null
            })
            if (res?.data) {
                setResult(res.data)
            } else {
                setError('Réponse inattendue du serveur')
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Erreur lors du pré-diagnostic')
        } finally {
            setLoading(false)
        }
    }

    // Auto-lancer au premier rendu si description présente
    useEffect(() => {
        if (description?.trim()) {
            runPreDiagnostic()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="prediag-panel">
                <div className="prediag-loading">
                    <div className="prediag-loading-spinner">
                        <HiOutlineCpuChip size={32} />
                    </div>
                    <p>Analyse en cours...</p>
                    <span className="prediag-loading-sub">L'IA examine la description du problème</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="prediag-panel">
                <div className="prediag-error">
                    <HiOutlineXCircle size={28} color="#ef4444" />
                    <p>{error}</p>
                    <div className="prediag-error-actions">
                        <button className="btn-retry" onClick={runPreDiagnostic}>
                            <HiOutlineArrowPath size={16} /> Réessayer
                        </button>
                        {onClose && (
                            <button className="btn-close" onClick={onClose}>Fermer</button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (!result) return null

    const severity = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium
    const recommendation = RECOMMENDATION_CONFIG[result.recommendation] || RECOMMENDATION_CONFIG.monitor
    const SeverityIcon = severity.icon
    const RecommendationIcon = recommendation.icon

    return (
        <motion.div
            className="prediag-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="prediag-header">
                <div className="prediag-header-left">
                    <HiOutlineSparkles size={20} className="prediag-header-icon" />
                    <div>
                        <h3>Pré-diagnostic IA</h3>
                        <span className="prediag-source">
                            {result.source === 'gemini' ? 'Analyse Gemini AI' : 'Analyse locale'}
                            {result.confidence && ` • Confiance : ${Math.round(result.confidence * 100)}%`}
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button className="prediag-close" onClick={onClose} title="Fermer">&times;</button>
                )}
            </div>

            {/* Severity + Recommendation badges */}
            <div className="prediag-badges">
                <div
                    className="prediag-badge"
                    style={{ background: severity.bg, borderColor: severity.border, color: severity.color }}
                >
                    <SeverityIcon size={18} />
                    <div>
                        <span className="prediag-badge-label">Sévérité</span>
                        <strong>{severity.label}</strong>
                    </div>
                </div>
                <div
                    className="prediag-badge"
                    style={{ background: recommendation.color + '18', borderColor: recommendation.color + '40', color: recommendation.color }}
                >
                    <RecommendationIcon size={18} />
                    <div>
                        <span className="prediag-badge-label">Recommandation</span>
                        <strong>{recommendation.label}</strong>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="prediag-summary">
                <p>{result.summary}</p>
            </div>

            {/* Quick fixes */}
            {result.quick_fixes?.length > 0 && (
                <div className="prediag-quickfixes">
                    <button
                        className="prediag-quickfixes-toggle"
                        onClick={() => setShowQuickFixes(!showQuickFixes)}
                    >
                        <HiOutlineLightBulb size={16} />
                        <span>Solutions rapides ({result.quick_fixes.length})</span>
                        <span className={`toggle-arrow ${showQuickFixes ? 'open' : ''}`}>▾</span>
                    </button>
                    <AnimatePresence>
                        {showQuickFixes && (
                            <motion.ul
                                className="prediag-quickfixes-list"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {result.quick_fixes.map((fix, i) => (
                                    <li key={i}>
                                        <HiOutlineWrenchScrewdriver size={14} />
                                        <span>{fix}</span>
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Injection warning */}
            {result.flagged_injection && (
                <div className="prediag-warning">
                    <HiOutlineExclamationTriangle size={16} />
                    <span>La description contenait des éléments inhabituels qui ont été filtrés.</span>
                </div>
            )}

            {/* Decision buttons */}
            <div className="prediag-actions">
                {result.recommendation !== 'deposit_required' && (
                    <button
                        className="prediag-btn prediag-btn-self"
                        onClick={() => onDecision?.('self_fix')}
                    >
                        <HiOutlineHandRaised size={18} />
                        <div>
                            <strong>Résoudre moi-même</strong>
                            <small>Appliquer les solutions rapides</small>
                        </div>
                    </button>
                )}
                <button
                    className="prediag-btn prediag-btn-depot"
                    onClick={() => onDecision?.('depot')}
                >
                    <HiOutlineArchiveBox size={18} />
                    <div>
                        <strong>{result.recommendation === 'deposit_required' ? 'Confirmer le dépôt' : 'Déposer quand même'}</strong>
                        <small>Transmettre au service technique</small>
                    </div>
                </button>
            </div>
        </motion.div>
    )
}

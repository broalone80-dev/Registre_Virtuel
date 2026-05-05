import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineDesktopComputer, HiOutlineX } from 'react-icons/hi'
import {
    HiOutlineArchiveBox, HiOutlineCheckCircle, HiOutlineWrenchScrewdriver,
    HiOutlineUserCircle, HiOutlineLightBulb, HiOutlineArrowPath,
    HiOutlineCpuChip, HiOutlineHandRaised
} from 'react-icons/hi2'
import { Toaster } from 'react-hot-toast'

export default function AIDiagnosticPhase({
    formData,
    aiData,
    aiLoading,
    aiCurrentStep,
    aiAnswers,
    aiComplete,
    aiFinalResult,
    aiDecision,
    submitting,
    onAnswer,
    onSetDecision,
    onSubmit,
    onResetAndBack
}) {
    const chatEndRef = useRef(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [aiAnswers, aiData, aiComplete])

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
                    <button className="btn-back-form" onClick={onResetAndBack}>
                        <HiOutlineX size={18} /> Retour
                    </button>
                </div>

                <div className="ai-context-bar">
                    <span><HiOutlineDesktopComputer size={16} /> {formData.brand} {formData.model || formData.equipment_type}</span>
                    <span className="ai-separator">•</span>
                    <span className="ai-problem-preview">{formData.problem_description.substring(0, 80)}{formData.problem_description.length > 80 ? '...' : ''}</span>
                </div>

                <div className="ai-chat">
                    {aiData && (
                        <motion.div className="ai-msg ai-msg-bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="ai-msg-avatar"><HiOutlineCpuChip size={18} /></div>
                            <div className="ai-msg-content">
                                <p>J'ai identifié un problème de type <strong>{aiData.problemType}</strong> (maintenance {aiData.maintenanceType}). Je vais vous poser quelques questions pour analyser la situation.</p>
                            </div>
                        </motion.div>
                    )}

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
                                                    <button key={j} className="ai-option-btn" onClick={() => onAnswer(opt)}>
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

                    {aiLoading && (
                        <div className="ai-msg ai-msg-bot">
                            <div className="ai-msg-avatar"><HiOutlineCpuChip size={18} /></div>
                            <div className="ai-msg-content"><div className="ai-typing"><span></span><span></span><span></span></div></div>
                        </div>
                    )}

                    {aiComplete && aiFinalResult && !aiDecision && (
                        <motion.div className="ai-result-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <h3><HiOutlineLightBulb size={20} /> Analyse terminée</h3>
                            <p className="ai-result-summary">{aiFinalResult.finalSummary}</p>

                            {aiFinalResult.preDiagnostic && (
                                <div className="ai-prediag-inline">
                                    <div className="ai-prediag-badges">
                                        <span className={`ai-prediag-tag severity-${aiFinalResult.preDiagnostic.severity}`}>
                                            Sévérité : {aiFinalResult.preDiagnostic.severity === 'low' ? 'Faible' : aiFinalResult.preDiagnostic.severity === 'medium' ? 'Moyenne' : 'Élevée'}
                                        </span>
                                        <span className={`ai-prediag-tag reco-${aiFinalResult.preDiagnostic.recommendation}`}>
                                            {aiFinalResult.preDiagnostic.recommendation === 'no_action' ? 'Pas de dépôt nécessaire'
                                                : aiFinalResult.preDiagnostic.recommendation === 'monitor' ? 'À surveiller'
                                                : 'Dépôt recommandé'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {aiFinalResult.preDiagnostic?.quick_fixes?.length > 0 && (
                                <div className="ai-actions-list">
                                    <h4>Solutions rapides :</h4>
                                    <ul>
                                        {aiFinalResult.preDiagnostic.quick_fixes.map((fix, i) => (
                                            <li key={i}><HiOutlineLightBulb size={14} /> {fix}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiFinalResult.recommendedActions?.length > 0 && (
                                <div className="ai-actions-list">
                                    <h4>Actions techniques recommandées :</h4>
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
                                    <button className="ai-decision-btn self-fix" onClick={() => onSetDecision('self_fix')}>
                                        <HiOutlineHandRaised size={20} />
                                        <span>Je gère moi-même</span>
                                        <small>Suivre les actions ci-dessus</small>
                                    </button>
                                    <button className="ai-decision-btn depot" onClick={() => onSetDecision('depot')}>
                                        <HiOutlineArchiveBox size={20} />
                                        <span>Envoyer au maintenancier</span>
                                        <small>Créer un dépôt officiel</small>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {aiDecision === 'self_fix' && (
                        <motion.div className="ai-result-card ai-self-fix-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <h3><HiOutlineCheckCircle size={20} color="#10b981" /> Bonne chance !</h3>
                            <p>Suivez les étapes recommandées. Si le problème persiste, vous pourrez toujours créer un dépôt.</p>
                            <div className="ai-decision-btns">
                                <button className="btn-primary" onClick={onResetAndBack}>
                                    <HiOutlineArrowPath size={16} /> Retour au formulaire
                                </button>
                                <button className="btn-secondary" onClick={() => onSetDecision('depot')}>
                                    Finalement, créer le dépôt
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {aiDecision === 'depot' && (
                        <motion.div className="ai-result-card ai-depot-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <h3><HiOutlineArchiveBox size={20} color="#3b82f6" /> Création du dépôt</h3>
                            <p>Le diagnostic sera joint au dépôt pour aider le maintenancier.</p>
                            <button
                                className="btn-primary btn-depot-final"
                                onClick={onSubmit}
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

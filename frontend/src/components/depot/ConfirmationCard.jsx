import { motion } from 'framer-motion'
import { HiOutlineCheckCircle, HiOutlineArchiveBox } from 'react-icons/hi2'

export default function ConfirmationCard({ lastRef, formData, onReset }) {
    return (
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
            <button onClick={onReset} className="btn-primary">
                <HiOutlineArchiveBox size={18} /> Nouveau dépôt
            </button>
        </motion.div>
    )
}

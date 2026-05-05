import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineDesktopComputer
} from 'react-icons/hi'
import { HiOutlineTrash, HiOutlineXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2'
import './DeleteConfirmModal.css'

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.15 } }
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 350 } },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
}

export default function DeleteConfirmModal({ equipment, onConfirm, onCancel }) {
    const [deleting, setDeleting] = useState(false)

    const handleConfirm = async () => {
        setDeleting(true)
        try {
            await onConfirm(equipment.id)
        } finally {
            setDeleting(false)
        }
    }

    if (!equipment) return null

    const name = [equipment.brand, equipment.model].filter(Boolean).join(' ') || 'Équipement'
    const ref = equipment.reference || equipment.serial || equipment.serial_number || '—'

    return (
        <AnimatePresence>
            <motion.div
                className="delete-modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onCancel}
            >
                <motion.div
                    className="delete-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="delete-modal-danger-bar" />

                    <div className="delete-modal-body">
                        <div className="delete-modal-icon-wrap">
                            <HiOutlineTrash size={32} />
                        </div>

                        <h2 className="delete-modal-title">Supprimer définitivement ?</h2>
                        <p className="delete-modal-text">
                            Cette action est <strong>irréversible</strong>. L'équipement, ses diagnostics,
                            interventions et messages associés seront supprimés.
                        </p>

                        <div className="delete-modal-equipment-card">
                            <div className="delete-modal-eq-icon">
                                <HiOutlineDesktopComputer size={22} />
                            </div>
                            <div className="delete-modal-eq-info">
                                <span className="delete-modal-eq-name">{name}</span>
                                <div className="delete-modal-eq-details">
                                    <span>Réf: {ref}</span>
                                    {equipment.agency_name && <span>• {equipment.agency_name}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="delete-modal-warning">
                            <HiOutlineExclamationTriangle size={18} />
                            <span>Les diagnostics, interventions et messages liés seront également supprimés.</span>
                        </div>
                    </div>

                    <div className="delete-modal-footer">
                        <button
                            className="delete-modal-btn delete-modal-btn-cancel"
                            onClick={onCancel}
                            disabled={deleting}
                        >
                            <HiOutlineXMark size={16} /> Annuler
                        </button>
                        <button
                            className="delete-modal-btn delete-modal-btn-confirm"
                            onClick={handleConfirm}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <><div className="delete-modal-spinner" /> Suppression...</>
                            ) : (
                                <><HiOutlineTrash size={16} /> Supprimer</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

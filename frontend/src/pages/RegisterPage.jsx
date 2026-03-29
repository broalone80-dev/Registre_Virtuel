import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useApi } from '../hooks/useApi'
import { motion } from 'framer-motion'
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone, HiOutlineLogin, HiOutlineExclamation } from 'react-icons/hi'
import { HiOutlineComputerDesktop, HiOutlineWrenchScrewdriver, HiOutlineClipboardDocumentList, HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
import './LoginPage.css'

export default function RegisterPage() {
    const navigate = useNavigate()
    const register = useAuthStore((s) => s.register)
    const loading = useAuthStore((s) => s.loading)
    const error = useAuthStore((s) => s.error)
    const api = useApi()

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'receptionist',
        agency_id: ''
    })

    const [agencies, setAgencies] = useState([])
    const [localError, setLocalError] = useState('')

    useEffect(() => {
        const loadAgencies = async () => {
            try {
                const res = await api.get('/agencies')
                if (res?.data && Array.isArray(res.data)) {
                    setAgencies(res.data)
                }
            } catch {
                // Fallback agences de démo
                setAgencies([
                    { id: 'ag1', name: 'Douala Centre', code: 'DLA-C' },
                    { id: 'ag2', name: 'Yaoundé Nord', code: 'YDE-N' },
                    { id: 'ag3', name: 'Bafoussam', code: 'BFS' },
                    { id: 'ag4', name: 'Bamenda', code: 'BDA' },
                    { id: 'ag5', name: 'Garoua', code: 'GRA' }
                ])
            }
        }
        loadAgencies()
    }, [])

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLocalError('')

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Les mots de passe ne correspondent pas')
            return
        }

        if (formData.password.length < 6) {
            setLocalError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        if (formData.role === 'receptionist' && !formData.agency_id) {
            setLocalError('Veuillez sélectionner votre agence')
            return
        }

        try {
            const { confirmPassword, ...submitData } = formData
            await register(submitData)
            toast.success('Compte créé avec succès !')
            navigate('/')
        } catch (err) {
            toast.error('Erreur lors de l\'inscription')
        }
    }

    return (
        <div className="login-container">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' }
            }} />
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <motion.div
                className="login-card"
                style={{ maxWidth: '520px' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="login-header">
                    <div className="login-logo"><HiOutlineComputerDesktop size={48} /></div>
                    <h1 className="login-title">Créer un compte</h1>
                    <p className="login-subtitle">Registre Virtuel Express Union</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {(error || localError) && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <HiOutlineExclamation style={{ marginRight: 6, verticalAlign: 'middle', fontSize: 18 }} />
                            {localError || error}
                        </motion.div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label"><HiOutlineUser style={{ marginRight: 4, verticalAlign: 'middle' }} /> Prénom</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => updateField('first_name', e.target.value)}
                                placeholder="Prénom"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><HiOutlineUser style={{ marginRight: 4, verticalAlign: 'middle' }} /> Nom</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => updateField('last_name', e.target.value)}
                                placeholder="Nom"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><HiOutlineMail style={{ marginRight: 4, verticalAlign: 'middle' }} /> Email professionnel</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="email@expressunion.cm"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><HiOutlinePhone style={{ marginRight: 4, verticalAlign: 'middle' }} /> Téléphone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="+237 6XX XXX XXX"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Profil</label>
                        <select
                            value={formData.role}
                            onChange={(e) => updateField('role', e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="receptionist">Agent Express Union</option>
                            <option value="technician">Maintenancier</option>
                        </select>
                    </div>

                    {formData.role === 'receptionist' && (
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <label className="form-label"><HiOutlineBuildingOffice2 style={{ marginRight: 4, verticalAlign: 'middle' }} /> Agence</label>
                            <select
                                value={formData.agency_id}
                                onChange={(e) => updateField('agency_id', e.target.value)}
                                className="form-input"
                                required
                            >
                                <option value="">-- Choisir votre agence --</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.code})
                                    </option>
                                ))}
                            </select>
                        </motion.div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label"><HiOutlineLockClosed style={{ marginRight: 4, verticalAlign: 'middle' }} /> Mot de passe</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                placeholder="Min. 6 caractères"
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><HiOutlineLockClosed style={{ marginRight: 4, verticalAlign: 'middle' }} /> Confirmer</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                placeholder="Confirmer"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">Création...</span>
                        ) : (
                            <><HiOutlineLogin style={{ marginRight: 8, verticalAlign: 'middle', fontSize: 20 }} /> Créer mon compte</>
                        )}
                    </button>

                    <p className="register-link">
                        Déjà un compte ? <Link to="/login">Se connecter</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    )
}

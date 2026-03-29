import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import './LoginPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        if (!token) {
            setError('Token de réinitialisation manquant')
            return
        }

        setLoading(true)
        try {
            await axios.post(`${API_BASE}/auth/reset-password`, { token, password })
            setSuccess(true)
            toast.success('Mot de passe réinitialisé !')
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la réinitialisation'
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' }
            }} />
            <div className="background">
                <div className="blob blob1" />
                <div className="blob blob2" />
                <div className="blob blob3" />
            </div>

            <motion.div
                className="login-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="login-header">
                    <h1>Registre Virtuel</h1>
                    <p>Nouveau mot de passe</p>
                </div>

                <motion.div
                    className="login-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '30px 0' }}
                        >
                            <HiOutlineCheckCircle style={{ fontSize: 64, color: '#22c55e', marginBottom: 16 }} />
                            <h2 style={{ color: '#e2e8f0', fontSize: 22, marginBottom: 12 }}>Mot de passe réinitialisé !</h2>
                            <p style={{ color: '#94a3b8', fontSize: 15 }}>
                                Redirection vers la page de connexion...
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <HiOutlineShieldCheck style={{ fontSize: 48, color: '#3b82f6', marginBottom: 12 }} />
                                <h2 style={{ color: '#e2e8f0', fontSize: 20, marginBottom: 8 }}>Nouveau mot de passe</h2>
                                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                                    Choisissez un nouveau mot de passe sécurisé.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label><HiOutlineLockClosed style={{ marginRight: 6, verticalAlign: 'middle' }} /> Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 caractères"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label><HiOutlineLockClosed style={{ marginRight: 6, verticalAlign: 'middle' }} /> Confirmer</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmer le mot de passe"
                                        required
                                    />
                                </div>

                                {error && (
                                    <motion.div
                                        className="error-message"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <HiOutlineExclamation style={{ marginRight: 6, verticalAlign: 'middle', fontSize: 18 }} />
                                        {error}
                                    </motion.div>
                                )}

                                <button type="submit" disabled={loading} className="submit-btn">
                                    {loading ? (
                                        <span className="btn-loading">Réinitialisation...</span>
                                    ) : (
                                        <><HiOutlineShieldCheck style={{ marginRight: 8, verticalAlign: 'middle', fontSize: 20 }} /> Réinitialiser</>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="register-link">
                        <Link to="/login">← Retour à la connexion</Link>
                    </p>
                </motion.div>

                <div className="footer">
                    © 2026 Registre Virtuel EU • Senior Dev v1.0
                </div>
            </motion.div>
        </div>
    )
}

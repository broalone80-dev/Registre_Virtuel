import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineMail, HiOutlinePaperAirplane, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import './LoginPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await axios.post(`${API_BASE}/auth/forgot-password`, { email })
            setSent(true)
            toast.success('Email envoyé avec succès !')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi')
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
                    <p>Réinitialisation du mot de passe</p>
                </div>

                <motion.div
                    className="login-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {sent ? (
                        <motion.div
                            className="forgot-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '30px 0' }}
                        >
                            <HiOutlineCheckCircle style={{ fontSize: 64, color: '#22c55e', marginBottom: 16 }} />
                            <h2 style={{ color: '#e2e8f0', fontSize: 22, marginBottom: 12 }}>Email envoyé !</h2>
                            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6 }}>
                                Si un compte existe avec l'adresse <strong style={{ color: '#60a5fa' }}>{email}</strong>,
                                vous recevrez un email avec un lien de réinitialisation.
                            </p>
                            <p style={{ color: '#64748b', fontSize: 13, marginTop: 16 }}>
                                Vérifiez aussi vos spams.
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <HiOutlineMail style={{ fontSize: 48, color: '#3b82f6', marginBottom: 12 }} />
                                <h2 style={{ color: '#e2e8f0', fontSize: 20, marginBottom: 8 }}>Mot de passe oublié ?</h2>
                                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                                    Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label><HiOutlineMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre-email@example.com"
                                        required
                                    />
                                </div>

                                <button type="submit" disabled={loading} className="submit-btn">
                                    {loading ? (
                                        <span className="btn-loading">Envoi en cours...</span>
                                    ) : (
                                        <><HiOutlinePaperAirplane style={{ marginRight: 8, verticalAlign: 'middle', fontSize: 20 }} /> Envoyer le lien</>
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

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion } from 'framer-motion'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineLogin, HiOutlineCheck, HiOutlineExclamation } from 'react-icons/hi'
import { HiOutlineComputerDesktop, HiOutlineCpuChip, HiOutlineChartBar } from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
import './LoginPage.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const login = useAuthStore((s) => s.login)
    const loading = useAuthStore((s) => s.loading)
    const error = useAuthStore((s) => s.error)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login(email, password)
            toast.success('Connexion réussie !')
            navigate('/')
        } catch (err) {
            toast.error('Échec de la connexion')
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
                    <p>Gestion de matériel informatique</p>
                </div>

                <motion.div
                    className="login-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="features">
                        <div className="feature">
                            <span className="checkmark"><HiOutlineCheck /></span>
                            <span>Dashboard temps réel</span>
                        </div>
                        <div className="feature">
                            <span className="checkmark"><HiOutlineComputerDesktop /></span>
                            <span>Gestion d'équipements avancée</span>
                        </div>
                        <div className="feature">
                            <span className="checkmark"><HiOutlineCpuChip /></span>
                            <span>Diagnostics assistés par IA</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label><HiOutlineMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@registre.eu"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label><HiOutlineLockClosed style={{ marginRight: 6, verticalAlign: 'middle' }} /> Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="forgot-password-link">
                            <Link to="/forgot-password">Mot de passe oublié ?</Link>
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
                                <span className="btn-loading">Connexion...</span>
                            ) : (
                                <><HiOutlineLogin style={{ marginRight: 8, verticalAlign: 'middle', fontSize: 20 }} /> Se connecter</>
                            )}
                        </button>

                        <p className="register-link">
                            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
                        </p>
                    </form>
                </motion.div>

                <motion.div
                    className="credentials"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="credentials-title">Identifiants de démonstration</p>
                    <div className="credentials-grid">
                        <div className="credential-box">
                            <span className="label">Email</span>
                            <span className="value">admin@registre.eu</span>
                        </div>
                        <div className="credential-box">
                            <span className="label">Mot de passe</span>
                            <span className="value">admin123</span>
                        </div>
                    </div>
                </motion.div>

                <div className="footer">
                    © 2026 Registre Virtuel EU • Senior Dev v1.0
                </div>
            </motion.div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { HiOutlineQrCode, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineArchiveBox } from 'react-icons/hi2'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1'

export default function ScanPage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const [equipment, setEquipment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reporting, setReporting] = useState(false)
    const [description, setDescription] = useState('')
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await axios.get(`${API_BASE}/equipments/scan/${token}`)
                setEquipment(res.data.data)
            } catch (err) {
                setNotFound(true)
                toast.error("Équipement introuvable ou lien invalide")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchEquipment()
    }, [token])

    const handleReport = async (e) => {
        e.preventDefault()
        if (!description.trim()) return toast.error("Veuillez décrire le problème")

        setReporting(true)
        try {
            await axios.post(`${API_BASE}/ai/analyze`, {
                description,
                equipmentId: equipment.id
            })
            toast.success("Signalement envoyé avec succès ! Un technicien va l'analyser.")
            setDescription('')
        } catch (err) {
            toast.error("Erreur lors du signalement")
        } finally {
            setReporting(false)
        }
    }

    if (loading) return <div className="scan-loading">Chargement...</div>

    if (notFound || !equipment) return (
        <div className="scan-error" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', padding: '20px', textAlign: 'center' }}>
            <HiOutlineExclamationTriangle size={48} color="#ef4444" />
            <h1 style={{ margin: '16px 0 8px' }}>Équipement introuvable</h1>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Ce QR Code ne correspond à aucun équipement enregistré.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
                    <HiOutlineArchiveBox size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Connectez-vous pour l'ajouter
                </button>
                <button onClick={() => navigate('/')} style={{ padding: '12px 24px', background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>
                    Retour à l'accueil
                </button>
            </div>
        </div>
    )

    return (
        <div className="scan-page">
            <div className="scan-container anim-fade-in">
                <header className="scan-header">
                    <div className="scan-icon-blob">
                        <HiOutlineQrCode size={40} />
                    </div>
                    <h1>Équipement Identifié</h1>
                    <p className="scan-subtitle">Vérification du matériel terminée avec succès.</p>
                </header>

                <div className="equipment-luxury-card anim-slide-up">
                    <div className="card-accent"></div>
                    <div className="card-main">
                        <div className="eq-header">
                            <h2>{equipment.brand} {equipment.model}</h2>
                            <span className="eq-ref">#{equipment.reference}</span>
                        </div>

                        <div className="luxury-info-grid">
                            <div className="lux-item">
                                <span className="lux-label">Catégorie</span>
                                <span className="lux-value">{equipment.type?.name || 'Matériel'}</span>
                            </div>
                            <div className="lux-item">
                                <span className="lux-label">Localisation</span>
                                <span className="lux-value">{equipment.agency?.name || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="lux-status-row">
                            <span className="lux-label">État du système</span>
                            <div className={`lux-status-badge status-${equipment.status}`}>
                                <span className="dot"></span>
                                {equipment.status?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <form className="luxury-report-form anim-slide-up" style={{ animationDelay: '0.1s' }} onSubmit={handleReport}>
                    <div className="form-header">
                        <h3>Signaler une anomalie</h3>
                        <p>Une IA analysera votre demande pour prioriser l'intervention.</p>
                    </div>

                    <div className="input-animate-group">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez le problème ici..."
                            required
                        />
                    </div>

                    <button type="submit" className="btn-luxury-primary" disabled={reporting}>
                        {reporting ? (
                            <>
                                <span className="loader-dots"></span>
                                Analyse IA en cours...
                            </>
                        ) : (
                            <>
                                <HiOutlineCheckCircle size={20} />
                                Envoyer le signalement
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .scan-page {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px 20px;
                    background: radial-gradient(circle at top right, #1e293b, #0f172a);
                    color: white;
                    font-family: 'Inter', sans-serif;
                }
                .scan-container {
                    max-width: 540px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .scan-header {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .scan-icon-blob {
                    width: 80px;
                    height: 80px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #3b82f6;
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
                }
                .scan-header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
                .scan-subtitle { color: #64748b; font-size: 15px; margin: 0; }
                
                .equipment-luxury-card {
                    background: rgba(30, 41, 59, 0.5);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                }
                .card-accent {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 4px;
                    background: linear-gradient(90deg, #3b82f6, #60a5fa);
                }
                .card-main { padding: 32px; }
                .eq-header { margin-bottom: 24px; }
                .eq-header h2 { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
                .eq-ref { font-size: 13px; font-weight: 700; color: #3b82f6; opacity: 0.8; }
                
                .luxury-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    padding: 24px 0;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                    margin-bottom: 24px;
                }
                .lux-item { display: flex; flex-direction: column; gap: 4px; }
                .lux-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; }
                .lux-value { font-size: 15px; font-weight: 600; color: #e2e8f0; }
                
                .lux-status-row { display: flex; justify-content: space-between; align-items: center; }
                .lux-status-badge {
                    display: flex; align-items: center; gap: 8px;
                    padding: 8px 16px; border-radius: 12px;
                    font-size: 12px; font-weight: 700; background: rgba(148, 163, 184, 0.1);
                }
                .lux-status-badge.status-active { color: #10b981; background: rgba(16, 185, 129, 0.1); }
                .lux-status-badge.status-repair { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
                .lux-status-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                
                .luxury-report-form {
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 24px;
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .form-header h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
                .form-header p { font-size: 14px; color: #64748b; margin: 0; }
                
                textarea {
                    width: 100%; height: 120px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 16px;
                    padding: 20px; color: white;
                    font-size: 15px; line-height: 1.6;
                    transition: all 0.3s; resize: none;
                }
                textarea:focus { outline: none; border-color: #3b82f6; background: rgba(15, 23, 42, 0.8); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                
                .btn-luxury-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white; border: none; border-radius: 16px;
                    padding: 16px; font-size: 16px; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center; gap: 12px;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                }
                .btn-luxury-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4); }
                .btn-luxury-primary:disabled { opacity: 0.7; cursor: not-allowed; }

                .anim-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .anim-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                
                .loader-dots {
                    width: 4px; height: 4px; border-radius: 50%;
                    background: white; box-shadow: 10px 0 0 white, 20px 0 0 white;
                    animation: dots 1s infinite alternate;
                    margin-right: 20px;
                }
                @keyframes dots { from { opacity: 0.2; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}

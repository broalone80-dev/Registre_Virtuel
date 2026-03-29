import { useRef } from 'react'
import { HiOutlinePrinter, HiOutlineXMark } from 'react-icons/hi2'

const RESULT_LABELS = {
    repairable: 'Réparable',
    unrepairable: 'Irréparable',
    needs_parts: 'Nécessite des pièces',
    pending: 'En cours d\'analyse',
    to_replace: 'À remplacer',
    to_exchange: 'À échanger'
}

const RESULT_COLORS = {
    repairable: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    unrepairable: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    needs_parts: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    pending: { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' },
    to_replace: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    to_exchange: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
}

export default function DiagnosticReport({ diagnostic, equipment, onClose }) {
    const printRef = useRef()

    const handlePrint = () => {
        const content = printRef.current.innerHTML
        const win = window.open('', '_blank')
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rapport Diagnostic — ${equipment?.reference || 'N/A'}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 0; color: #1e293b; background: #fff;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                    }
                    .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; position: relative; }

                    /* Top accent bar */
                    .accent-bar { height: 6px; background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa); border-radius: 0 0 3px 3px; }

                    /* Header */
                    .report-header {
                        display: flex; justify-content: space-between; align-items: flex-start;
                        padding: 32px 0 24px; border-bottom: 2px solid #e2e8f0;
                    }
                    .header-left h1 {
                        font-size: 22px; font-weight: 900; color: #0f172a;
                        letter-spacing: -0.5px; text-transform: uppercase;
                    }
                    .header-left .subtitle {
                        font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500;
                    }
                    .header-right { text-align: right; }
                    .header-right .company {
                        font-size: 18px; font-weight: 800; color: #1e40af;
                        letter-spacing: -0.3px;
                    }
                    .header-right .tagline { font-size: 11px; color: #94a3b8; margin-top: 2px; }

                    /* Meta row */
                    .meta-row {
                        display: flex; justify-content: space-between; padding: 16px 0;
                        font-size: 12px; color: #64748b; font-weight: 500;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .meta-item { display: flex; gap: 6px; }
                    .meta-label { color: #94a3b8; }

                    /* Section */
                    .section { margin-top: 28px; }
                    .section-title {
                        font-size: 13px; font-weight: 800; color: #1e40af;
                        text-transform: uppercase; letter-spacing: 1.2px;
                        margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
                    }
                    .section-title::before {
                        content: ''; display: inline-block; width: 4px; height: 16px;
                        background: linear-gradient(180deg, #3b82f6, #1e40af); border-radius: 2px;
                    }

                    /* Info grid */
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .info-card {
                        padding: 14px 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                        border-radius: 10px; border: 1px solid #e2e8f0;
                    }
                    .info-card .label {
                        font-size: 10px; color: #94a3b8; text-transform: uppercase;
                        font-weight: 700; letter-spacing: 0.8px;
                    }
                    .info-card .value {
                        font-size: 15px; color: #0f172a; font-weight: 700; margin-top: 4px;
                    }

                    /* Result badge */
                    .result-box {
                        padding: 20px; border-radius: 12px; text-align: center;
                        margin: 12px 0;
                    }
                    .result-box .verdict-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; opacity: 0.7; }
                    .result-box .verdict-value { font-size: 20px; font-weight: 900; margin-top: 4px; }

                    /* Description */
                    .desc-box {
                        padding: 18px 20px; background: #f8fafc; border-left: 4px solid #3b82f6;
                        border-radius: 0 10px 10px 0; font-size: 14px; line-height: 1.7;
                        color: #334155;
                    }

                    /* Signatures */
                    .signatures {
                        margin-top: 50px; display: flex; justify-content: space-between;
                        padding-top: 20px;
                    }
                    .sig-box { width: 42%; text-align: center; }
                    .sig-line {
                        border-top: 2px solid #cbd5e1; margin-top: 70px;
                        padding-top: 10px; font-size: 12px; color: #64748b; font-weight: 600;
                    }

                    /* Footer */
                    .report-footer {
                        margin-top: 40px; padding-top: 16px;
                        border-top: 2px solid #e2e8f0;
                        display: flex; justify-content: space-between;
                        font-size: 11px; color: #94a3b8;
                    }
                    .report-footer .confidential {
                        font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
                        color: #cbd5e1;
                    }

                    @media print {
                        body { padding: 0; }
                        .page { padding: 20px 30px; }
                    }
                </style>
            </head>
            <body>
                <div class="accent-bar"></div>
                <div class="page">${content}</div>
            </body>
            </html>
        `)
        win.document.close()
        setTimeout(() => win.print(), 400)
    }

    if (!diagnostic || !equipment) return null

    const resultColor = RESULT_COLORS[diagnostic.result] || RESULT_COLORS.pending

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="premium-modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <div className="premium-modal-header">
                    <h2 className="modal-title">Rapport de Diagnostic</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePrint} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                            borderRadius: '10px', background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                        }}>
                            <HiOutlinePrinter size={16} /> Imprimer / PDF
                        </button>
                        <button className="btn-close" onClick={onClose}>
                            <HiOutlineXMark size={24} />
                        </button>
                    </div>
                </div>

                <div className="premium-modal-body" style={{ maxHeight: '70vh', overflow: 'auto' }}>
                    <div ref={printRef}>
                        <div className="report-header">
                            <div className="header-left">
                                <h1>Rapport de Diagnostic</h1>
                                <div className="subtitle">Analyse technique de l'équipement</div>
                            </div>
                            <div className="header-right">
                                <div className="company">REGISTRE VIRTUEL</div>
                                <div className="tagline">Gestion de Parc Informatique</div>
                            </div>
                        </div>

                        <div className="meta-row">
                            <div className="meta-item">
                                <span className="meta-label">Référence :</span>
                                <strong>{equipment.reference}</strong>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Date :</span>
                                <strong>{new Date(diagnostic.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">N° :</span>
                                <strong>{diagnostic.reference || `DIAG-${diagnostic.id || '000'}`}</strong>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">Informations Équipement</div>
                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="label">Référence</div>
                                    <div className="value">{equipment.reference}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Marque / Modèle</div>
                                    <div className="value">{equipment.brand} {equipment.model}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">N° de série</div>
                                    <div className="value">{equipment.serial_number || 'N/A'}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Agence</div>
                                    <div className="value">{equipment.agency?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">Résultat du Diagnostic</div>
                            <div className="result-box" style={{
                                background: resultColor.bg,
                                border: `2px solid ${resultColor.border}`
                            }}>
                                <div className="verdict-label" style={{ color: resultColor.color }}>Verdict</div>
                                <div className="verdict-value" style={{ color: resultColor.color }}>
                                    {RESULT_LABELS[diagnostic.result] || diagnostic.result}
                                </div>
                            </div>
                            <div className="info-grid" style={{ marginTop: '12px' }}>
                                <div className="info-card">
                                    <div className="label">Coût estimé</div>
                                    <div className="value">{diagnostic.estimated_cost ? `${Number(diagnostic.estimated_cost).toLocaleString()} FCFA` : 'Non estimé'}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Durée estimée</div>
                                    <div className="value">{diagnostic.estimated_hours ? `${diagnostic.estimated_hours} heures` : 'Non estimée'}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Diagnosticien</div>
                                    <div className="value">{diagnostic.technician ? `${diagnostic.technician.first_name} ${diagnostic.technician.last_name}` : 'N/A'}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Type de panne</div>
                                    <div className="value">{diagnostic.fault_type || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">Description de la Panne</div>
                            <div className="desc-box">
                                {diagnostic.fault_description || 'Aucune description fournie.'}
                            </div>
                        </div>

                        {(diagnostic.notes || diagnostic.recommendations) && (
                            <div className="section">
                                <div className="section-title">Notes & Recommandations</div>
                                <div className="desc-box">
                                    {diagnostic.notes || diagnostic.recommendations || 'Aucune note.'}
                                </div>
                            </div>
                        )}

                        <div className="signatures">
                            <div className="sig-box">
                                <div className="sig-line">Technicien diagnosticien</div>
                            </div>
                            <div className="sig-box">
                                <div className="sig-line">Responsable technique</div>
                            </div>
                        </div>

                        <div className="report-footer">
                            <span className="confidential">Document confidentiel</span>
                            <span>Registre Virtuel © {new Date().getFullYear()}</span>
                            <span>Généré le {new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

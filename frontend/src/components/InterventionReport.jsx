import { useRef } from 'react'
import { HiOutlinePrinter, HiOutlineXMark } from 'react-icons/hi2'

export default function InterventionReport({ intervention, equipment, diagnostic, onClose }) {
    const printRef = useRef()

    const handlePrint = () => {
        const content = printRef.current.innerHTML
        const win = window.open('', '_blank')
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rapport Intervention — ${equipment?.reference || 'N/A'}</title>
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
                    .accent-bar { height: 6px; background: linear-gradient(90deg, #c2410c, #f97316, #fb923c); border-radius: 0 0 3px 3px; }

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
                        font-size: 18px; font-weight: 800; color: #c2410c;
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
                        font-size: 13px; font-weight: 800; color: #c2410c;
                        text-transform: uppercase; letter-spacing: 1.2px;
                        margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
                    }
                    .section-title::before {
                        content: ''; display: inline-block; width: 4px; height: 16px;
                        background: linear-gradient(180deg, #f97316, #c2410c); border-radius: 2px;
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

                    /* Status badge */
                    .status-badge {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px;
                    }
                    .status-dot { width: 8px; height: 8px; border-radius: 50%; }

                    /* Description */
                    .desc-box {
                        padding: 18px 20px; background: #f8fafc; border-left: 4px solid #f97316;
                        border-radius: 0 10px 10px 0; font-size: 14px; line-height: 1.7;
                        color: #334155;
                    }

                    /* Summary box */
                    .summary-box {
                        padding: 16px 20px; background: linear-gradient(135deg, #fffbeb, #fef3c7);
                        border: 1px solid #fde68a; border-radius: 10px;
                        margin-top: 12px; font-size: 14px; line-height: 1.6; color: #92400e;
                    }
                    .summary-box strong { color: #78350f; }

                    /* Parts table */
                    .parts-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 12px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
                    .parts-table th {
                        padding: 12px 16px; text-align: left; font-size: 10px;
                        font-weight: 800; color: #64748b; text-transform: uppercase;
                        letter-spacing: 0.8px; background: #f8fafc;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .parts-table td {
                        padding: 12px 16px; font-size: 14px; color: #1e293b;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .parts-table tr:last-child td { border-bottom: none; }

                    /* Quality check */
                    .quality-box {
                        padding: 20px; border-radius: 12px; text-align: center;
                    }
                    .quality-passed { background: #dcfce7; border: 2px solid #86efac; }
                    .quality-failed { background: #fee2e2; border: 2px solid #fca5a5; }
                    .quality-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
                    .quality-value { font-size: 18px; font-weight: 900; margin-top: 4px; }

                    /* Signatures */
                    .signatures {
                        margin-top: 50px; display: flex; justify-content: space-between;
                    }
                    .sig-box { width: 30%; text-align: center; }
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

    if (!intervention || !equipment) return null

    const duration = intervention.total_duration_minutes
        ? `${Math.floor(intervention.total_duration_minutes / 60)}h ${intervention.total_duration_minutes % 60}min`
        : intervention.started_at && intervention.completed_at
            ? `${Math.round((new Date(intervention.completed_at) - new Date(intervention.started_at)) / 60000)} min`
            : 'N/A'

    const parts = intervention.parts_used || []

    const statusLabel = {
        delivered: 'Livré', available: 'Disponible', waiting_pickup: 'Prêt à récupérer',
        in_transit: 'En transit', repaired: 'Réparé', in_repair: 'En réparation'
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="premium-modal" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
                <div className="premium-modal-header">
                    <h2 className="modal-title">Rapport d'Intervention</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePrint} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                            borderRadius: '10px', background: 'linear-gradient(135deg, #c2410c, #f97316)',
                            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)'
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
                                <h1>Rapport de Fin d'Intervention</h1>
                                <div className="subtitle">Résumé complet de la maintenance effectuée</div>
                            </div>
                            <div className="header-right">
                                <div className="company">REGISTRE VIRTUEL</div>
                                <div className="tagline">Gestion de Parc Informatique</div>
                            </div>
                        </div>

                        <div className="meta-row">
                            <div className="meta-item">
                                <span className="meta-label">Équipement :</span>
                                <strong>{equipment.reference}</strong>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Date :</span>
                                <strong>{intervention.completed_at
                                    ? new Date(intervention.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : new Date().toLocaleDateString('fr-FR')}</strong>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Réf :</span>
                                <strong>{intervention.reference || `INT-${intervention.id || '000'}`}</strong>
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
                                    <div className="label">Statut final</div>
                                    <div className="value">
                                        <span className="status-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                            <span className="status-dot" style={{ background: '#22c55e' }}></span>
                                            {statusLabel[equipment.status] || equipment.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {diagnostic && (
                            <div className="section">
                                <div className="section-title">Diagnostic Initial</div>
                                <div className="info-grid">
                                    <div className="info-card">
                                        <div className="label">Résultat diagnostic</div>
                                        <div className="value">{diagnostic.result || 'N/A'}</div>
                                    </div>
                                    <div className="info-card">
                                        <div className="label">Coût estimé</div>
                                        <div className="value">{diagnostic.estimated_cost ? `${Number(diagnostic.estimated_cost).toLocaleString()} FCFA` : 'N/A'}</div>
                                    </div>
                                </div>
                                {diagnostic.fault_description && (
                                    <div className="desc-box" style={{ marginTop: '12px' }}>
                                        {diagnostic.fault_description}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="section">
                            <div className="section-title">Détails de l'Intervention</div>
                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="label">Technicien</div>
                                    <div className="value">{intervention.technician
                                        ? `${intervention.technician.first_name} ${intervention.technician.last_name}`
                                        : (intervention.technician_name || 'N/A')}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Durée totale</div>
                                    <div className="value">{duration}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Début</div>
                                    <div className="value">{intervention.started_at ? new Date(intervention.started_at).toLocaleDateString('fr-FR') : 'N/A'}</div>
                                </div>
                                <div className="info-card">
                                    <div className="label">Fin</div>
                                    <div className="value">{intervention.completed_at ? new Date(intervention.completed_at).toLocaleDateString('fr-FR') : 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">Actions Réalisées</div>
                            <div className="desc-box">
                                {intervention.actions_performed || intervention.description || 'Aucune action spécifiée.'}
                            </div>
                            {intervention.result_notes && (
                                <div className="summary-box">
                                    <strong>Notes de résultat :</strong> {intervention.result_notes}
                                </div>
                            )}
                        </div>

                        {parts.length > 0 && (
                            <div className="section">
                                <div className="section-title">Pièces Remplacées</div>
                                <table className="parts-table">
                                    <thead>
                                        <tr>
                                            <th>Pièce</th>
                                            <th>Quantité</th>
                                            <th>Coût</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parts.map((part, i) => (
                                            <tr key={i}>
                                                <td>{part.name || part.part_id || 'N/A'}</td>
                                                <td>{part.quantity || 1}</td>
                                                <td>{part.cost ? `${Number(part.cost).toLocaleString()} FCFA` : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {intervention.quality_check_passed !== null && intervention.quality_check_passed !== undefined && (
                            <div className="section">
                                <div className="section-title">Contrôle Qualité</div>
                                <div className={`quality-box ${intervention.quality_check_passed ? 'quality-passed' : 'quality-failed'}`}>
                                    <div className="quality-label" style={{ color: intervention.quality_check_passed ? '#166534' : '#991b1b' }}>
                                        Résultat
                                    </div>
                                    <div className="quality-value" style={{ color: intervention.quality_check_passed ? '#166534' : '#991b1b' }}>
                                        {intervention.quality_check_passed ? '✅ VALIDÉ' : '❌ ÉCHOUÉ'}
                                    </div>
                                </div>
                                {intervention.quality_check_notes && (
                                    <div className="desc-box" style={{ marginTop: '12px' }}>
                                        {intervention.quality_check_notes}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="signatures">
                            <div className="sig-box">
                                <div className="sig-line">Technicien</div>
                            </div>
                            <div className="sig-box">
                                <div className="sig-line">Responsable</div>
                            </div>
                            <div className="sig-box">
                                <div className="sig-line">Client</div>
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

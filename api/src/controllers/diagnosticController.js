/**
 * CONTRÔLEUR DIAGNOSTIC
 * Gestion des diagnostics d'équipements
 * Workflow : equipment → diagnostic → intervention → delivery
 */

const { Diagnostic, Equipment, User, EquipmentType } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { createNotification, notifyAdmins } = require('../services/notificationService');

/**
 * Créer un diagnostic pour un équipement
 * POST /api/v1/diagnostics
 * ✅ PHASE 2: Avec validation d'état équipement
 */
const createDiagnostic = async (req, res) => {
    try {
        const {
            equipment_id,
            fault_type,
            fault_description,
            tests_performed,
            result,
            estimated_cost,
            estimated_hours,
            required_parts,
            notes
        } = req.body;

        // ✅ 1. VALIDER EQUIPMENT EXISTE
        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        // ✅ 2. VALIDER STATE ÉQUIPEMENT (NOUVEAU!)
        // Un diagnostic peut seulement être créé pour équipement en état:
        const VALID_DIAGNOSTIC_STATES = [
            'received',            // Juste reçu
            'waiting_diagnostic',  // En attente
            'in_diagnostic'        // Diagnostic en cours
        ];

        if (!VALID_DIAGNOSTIC_STATES.includes(equipment.status)) {
            return res.status(400).json({
                success: false,
                message: `Diagnostic ne peut pas être créé: équipement en état '${equipment.status}'`,
                current_state: equipment.status,
                allowed_states: VALID_DIAGNOSTIC_STATES,
                hint: `Pour créer un diagnostic, l'équipement doit être dans l'état: ${VALID_DIAGNOSTIC_STATES.join(', ')}`
            });
        }

        // ✅ 3. CRÉER DIAGNOSTIC
        const diagnostic = await Diagnostic.create({
            equipment_id,
            technician_id: req.user.id,
            fault_type,
            fault_description,
            tests_performed,
            result: result || 'pending',
            estimated_cost,
            estimated_hours,
            required_parts,
            notes
        });

        // ✅ 4. METTRE À JOUR EQUIPMENT STATUS
        await equipment.update({ status: 'in_diagnostic' });

        // ✅ 5. NOTIFIER CLIENT (equipment owner)
        if (equipment.received_by) {
            await createNotification({
                user_id: equipment.received_by,
                type: 'equipment',
                title: 'Diagnostic enregistré',
                message: `Le diagnostic technique pour votre équipement ${equipment.reference} a été enregistré.`,
                link: `/suivi/${equipment.qr_token}`
            });
        }

        // ✅ 6. NOTIFIER ADMIN/MANAGER (NOUVEAU!)
        try {
            await notifyAdmins({
                type: 'equipment',
                title: 'Nouveau diagnostic',
                message: `Diagnostic créé pour ${equipment.reference} par ${req.user.first_name || 'Un utilisateur'}`,
                link: `/diagnostics/${diagnostic.id}`
            });
        } catch (notifyErr) {
            logger.warn('Could not notify admins:', notifyErr.message);
        }

        // ✅ 7. REAL-TIME SOCKET UPDATE (via socketService - Phase 3)
        const socketService = require('../services/socketService');
        if (socketService && socketService.getIo()) {
            try {
                if (socketService.toEquipment) {
                    socketService.toEquipment(equipment_id, 'equipment:status_updated', {
                        equipmentId: equipment.id,
                        status: 'in_diagnostic',
                        diagnostic_id: diagnostic.id
                    });
                } else {
                    // Fallback to broadcast
                    socketService.broadcast('equipment:status_updated', {
                        equipmentId: equipment.id,
                        status: 'in_diagnostic'
                    });
                }
            } catch (sockErr) {
                logger.warn('Socket broadcast error:', sockErr.message);
            }
        }

        logger.info(`✓ Diagnostic créé: ${diagnostic.id} - Equipment: ${equipment.reference} - Technicien: ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Diagnostic créé avec succès',
            data: await diagnostic.reload({
                include: [
                    { model: Equipment, as: 'equipment', attributes: ['id', 'reference', 'status', 'brand', 'model'] },
                    { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name', 'email'] }
                ]
            })
        });

    } catch (error) {
        logger.error('Erreur création diagnostic:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du diagnostic',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les diagnostics avec filtres
 * GET /api/v1/diagnostics
 */
const getAllDiagnostics = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            equipment_id,
            result,
            technician_id,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};

        if (equipment_id) {
            where.equipment_id = equipment_id;
        }

        if (result) {
            where.result = result;
        }

        if (technician_id) {
            where.technician_id = technician_id;
        }

        const offset = (page - 1) * limit;

        const { count, rows: diagnostics } = await Diagnostic.findAndCountAll({
            where,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'reference', 'brand', 'model', 'status']
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            subQuery: false
        });

        res.status(200).json({
            success: true,
            data: diagnostics,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération diagnostics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des diagnostics',
            error: error.message
        });
    }
};

/**
 * Récupérer un diagnostic par ID
 * GET /api/v1/diagnostics/:id
 */
const getDiagnosticById = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnostic = await Diagnostic.findByPk(id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'reference', 'brand', 'model', 'serial_number', 'status', 'priority']
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                }
            ]
        });

        if (!diagnostic) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: diagnostic
        });

    } catch (error) {
        logger.error('Erreur récupération diagnostic:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du diagnostic',
            error: error.message
        });
    }
};

/**
 * Mettre à jour un diagnostic
 * PUT /api/v1/diagnostics/:id
 */
const updateDiagnostic = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fault_type,
            fault_description,
            tests_performed,
            result,
            estimated_cost,
            estimated_hours,
            required_parts,
            notes
        } = req.body;

        const diagnostic = await Diagnostic.findByPk(id);

        if (!diagnostic) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic non trouvé'
            });
        }

        await diagnostic.update({
            fault_type: fault_type || diagnostic.fault_type,
            fault_description: fault_description || diagnostic.fault_description,
            tests_performed: tests_performed || diagnostic.tests_performed,
            result: result || diagnostic.result,
            estimated_cost: estimated_cost !== undefined ? estimated_cost : diagnostic.estimated_cost,
            estimated_hours: estimated_hours !== undefined ? estimated_hours : diagnostic.estimated_hours,
            required_parts: required_parts || diagnostic.required_parts,
            notes: notes || diagnostic.notes
        });

        logger.info(`Diagnostic mis à jour: ${diagnostic.id}`);

        res.status(200).json({
            success: true,
            message: 'Diagnostic mis à jour avec succès',
            data: diagnostic
        });

    } catch (error) {
        logger.error('Erreur mise à jour diagnostic:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du diagnostic',
            error: error.message
        });
    }
};

/**
 * Valider un diagnostic (client approuve le devis)
 * PATCH /api/v1/diagnostics/:id/approve
 */
const approveDiagnostic = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnostic = await Diagnostic.findByPk(id);

        if (!diagnostic) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic non trouvé'
            });
        }

        // Récupérer l'équipement pour le mettre à jour
        const equipment = await Equipment.findByPk(diagnostic.equipment_id);

        // Marquer comme approuvé
        await diagnostic.update({
            customer_approved: true,
            customer_approved_at: new Date()
        });

        // Mettre à jour le statut de l'équipement
        if (diagnostic.result === 'repairable') {
            await equipment.update({ status: 'waiting_parts' });
        } else if (diagnostic.result === 'unrepairable') {
            await equipment.update({ status: 'unrepairable' });
        }

        logger.info(`Diagnostic approuvé: ${equipment.reference}`);

        res.status(200).json({
            success: true,
            message: 'Diagnostic approuvé',
            data: diagnostic
        });

    } catch (error) {
        logger.error('Erreur approbation diagnostic:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'approbation du diagnostic',
            error: error.message
        });
    }
};

/**
 * Récupérer les diagnostics d'un équipement
 * GET /api/v1/diagnostics/equipment/:equipmentId
 */
const getDiagnosticsByEquipment = async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        const diagnostics = await Diagnostic.findAll({
            where: { equipment_id: equipmentId },
            include: [
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            equipment: {
                id: equipment.id,
                reference: equipment.reference,
                status: equipment.status
            },
            data: diagnostics,
            count: diagnostics.length
        });

    } catch (error) {
        logger.error('Erreur récupération diagnostics équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des diagnostics',
            error: error.message
        });
    }
};

/**
 * Statistiques des diagnostics
 * GET /api/v1/diagnostics/stats/overview
 */
const getDiagnosticsStats = async (req, res) => {
    try {
        const { technician_id } = req.query;

        const where = {};
        if (technician_id) {
            where.technician_id = technician_id;
        }

        // Compter par résultat
        const statsByResult = await Diagnostic.findAll({
            where,
            attributes: [
                'result',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['result']
        });

        // Diagnostic en attente d'approbation
        const pendingApprovals = await Diagnostic.count({
            where: {
                ...where,
                customer_approved: false
            }
        });

        // Total diagnostics
        const totalDiagnostics = await Diagnostic.count({ where });

        // Coût moyen
        const averageCost = await Diagnostic.findOne({
            where,
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('estimated_cost')), 'avg_cost']
            ],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                total_diagnostics: totalDiagnostics,
                pending_approvals: pendingApprovals,
                average_cost: averageCost.avg_cost || 0,
                stats_by_result: statsByResult
            }
        });

    } catch (error) {
        logger.error('Erreur stats diagnostics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * Marquer un diagnostic comme terminé
 * PATCH /api/v1/diagnostics/:id/complete
 */
const completeDiagnostic = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnostic = await Diagnostic.findByPk(id);

        if (!diagnostic) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic non trouvé'
            });
        }

        // Si le résultat était en attente, le mettre en réparable par défaut
        if (diagnostic.result === 'pending') {
            await diagnostic.update({ result: 'repairable' });
        }

        // Mettre à jour le statut de l'équipement
        const equipment = await Equipment.findByPk(diagnostic.equipment_id);
        if (equipment) {
            await equipment.update({ status: 'waiting_approval' });
        }

        logger.info(`Diagnostic terminé manuellement: ${diagnostic.id}`);

        res.status(200).json({
            success: true,
            message: 'Diagnostic terminé',
            data: diagnostic
        });

    } catch (error) {
        logger.error('Erreur terminaison diagnostic:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la terminaison du diagnostic',
            error: error.message
        });
    }
};

module.exports = {
    createDiagnostic,
    getAllDiagnostics,
    getDiagnosticById,
    updateDiagnostic,
    approveDiagnostic,
    getDiagnosticsByEquipment,
    getDiagnosticsStats,
    completeDiagnostic
};
/**
 * CONTRÔLEUR INTERVENTION
 * Gestion des interventions/réparations d'équipements
 */

const { Intervention, Diagnostic, Equipment, User, InterventionLog } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { createNotification, notifyStaff } = require('../services/notificationService');
const socketService = require('../services/socketService');

/**
 * Créer une intervention sur un équipement
 * POST /api/v1/interventions
 * ✅ PHASE 2: Avec validation complète du diagnostic et technician
 */
const createIntervention = async (req, res) => {
    try {
        const {
            equipment_id,
            diagnostic_id,
            technician_id,
            priority,
            actions_performed,
            parts_used,
            result_notes
        } = req.body;

        // ✅ 1. VALIDER EQUIPMENT EXISTE
        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        // ✅ 2. VALIDER DIAGNOSTIC EST FOURNI (OPTIONNEL MAINTENANT)
        // ✅ 3. VALIDER DIAGNOSTIC EXISTE (SI FOURNI)

        // ✅ 3. VALIDER DIAGNOSTIC EXISTE (NOUVEAU!)
        let diagnostic = null;
        if (diagnostic_id) {
            diagnostic = await Diagnostic.findByPk(diagnostic_id);
            if (!diagnostic) {
                return res.status(404).json({
                    success: false,
                    message: `Diagnostic ${diagnostic_id} non trouvé`
                });
            }

            // ✅ 4. VALIDER diagnostic.equipment_id = equipment_id
            if (diagnostic.equipment_id !== equipment_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Le diagnostic n\'appartient pas à cet équipement',
                    diagnostic_equipment_id: diagnostic.equipment_id,
                    expected_equipment_id: equipment_id
                });
            }
        }

        // ✅ 5. VALIDER TECHNICIAN EXISTE (NOUVEAU!)
        const technicianToAssign = technician_id ?
            await User.findByPk(technician_id) :
            await User.findByPk(req.user.id);

        if (!technicianToAssign) {
            return res.status(404).json({
                success: false,
                message: 'Le technicien assigné n\'existe pas',
                technician_id: technician_id || req.user.id
            });
        }

        // ✅ 6. CRÉER INTERVENTION (maintenant sûr)
        const intervention = await Intervention.create({
            equipment_id,
            diagnostic_id: diagnostic_id || null,  // ← Sûr car validé si présent
            technician_id: technicianToAssign.id,
            priority: priority || 'medium',
            actions_performed,
            parts_used,
            result_notes,
            status: 'pending'
        });

        // ✅ 7. LOG INTERVENTION
        await InterventionLog.create({
            intervention_id: intervention.id,
            user_id: req.user.id,
            action_type: 'created',
            description: 'Création du dossier de maintenance',
            new_value: 'pending'
        });

        // ✅ 8. METTRE À JOUR EQUIPMENT
        await equipment.update({ status: 'in_repair' });

        // ✅ 9. NOTIFIER CLIENT
        if (equipment.received_by) {
            await createNotification({
                user_id: equipment.received_by,
                type: 'intervention',
                title: 'Réparation en cours',
                message: `Une intervention a été créée pour votre équipement ${equipment.reference}.`,
                link: `/suivi/${equipment.qr_token}`
            });
        }

        // ✅ 10. NOTIFIER TECHNICIAN (NOUVEAU!)
        if (technicianToAssign.id && technicianToAssign.id !== equipment.received_by) {
            await createNotification({
                user_id: technicianToAssign.id,
                type: 'intervention',
                title: 'Nouvelle intervention assignée',
                message: `Vous avez une nouvelle intervention pour ${equipment.reference}`,
                link: `/interventions/${intervention.id}`
            });
        }

        // ✅ 11. NOTIFIER ADMIN/MANAGER (NOUVEAU!) - via notifyStaff (if available)
        const { notifyAdmins } = require('../services/notificationService');
        try {
            await notifyAdmins({
                type: 'intervention',
                title: 'Nouvelle intervention créée',
                message: `Intervention créée pour ${equipment.reference} par ${req.user.first_name || 'Un utilisateur'}`,
                link: `/interventions/${intervention.id}`
            });
        } catch (notifyErr) {
            logger.warn('Could not notify admins:', notifyErr.message);
        }

        logger.info(`✓ Intervention créée: ${intervention.id} - Equipment: ${equipment.reference} - Tech: ${technicianToAssign.email}`);

        // ✅ 12. REAL-TIME SOCKET UPDATES (via socketService - Phase 3)
        if (socketService && socketService.getIo()) {
            try {
                // Alert equipment viewers (PHASE 3 optimization)
                if (socketService.toEquipment) {
                    socketService.toEquipment(equipment_id, 'intervention:created', {
                        id: intervention.id,
                        equipment_id
                    });
                } else {
                    // Fallback to broadcast
                    socketService.broadcast('intervention:created', { id: intervention.id });
                }
            } catch (sockErr) {
                logger.warn('Socket broadcast error:', sockErr.message);
            }
        }

        res.status(201).json({
            success: true,
            data: await intervention.reload({
                include: [
                    { model: Equipment, as: 'equipment', attributes: ['id', 'reference', 'brand', 'model'] },
                    { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name', 'email'] },
                    { model: Diagnostic, as: 'diagnostic', attributes: ['id', 'result', 'estimated_hours', 'fault_type'] }
                ]
            })
        });

    } catch (error) {
        logger.error('Erreur création intervention:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Récupérer toutes les interventions
 */
const getAllInterventions = async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};

        const interventions = await Intervention.findAll({
            where,
            include: [
                { model: Equipment, as: 'equipment', attributes: ['id', 'reference', 'brand', 'model', 'status'] },
                { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: interventions,
            pagination: { total: interventions.length, page: 1, limit: interventions.length }
        });
    } catch (error) {
        logger.error('Erreur getAllInterventions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer une intervention par ID
 */
const getInterventionById = async (req, res) => {
    try {
        const intervention = await Intervention.findByPk(req.params.id, {
            include: [
                { model: Equipment, as: 'equipment' },
                { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: Diagnostic, as: 'diagnostic' },
                {
                    model: InterventionLog,
                    as: 'logs',
                    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
                    order: [['created_at', 'ASC']]
                }
            ]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        res.status(200).json({ success: true, data: intervention });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mettre à jour l'avancement d'une intervention
 * PATCH /api/v1/interventions/:id/progress
 */
const updateInterventionProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, notes } = req.body;

        const intervention = await Intervention.findByPk(id, {
            include: [{ model: Equipment, as: 'equipment' }]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        const oldProgress = intervention.progress;
        await intervention.update({
            progress: progress !== undefined ? progress : intervention.progress,
            result_notes: notes || intervention.result_notes
        });

        if (progress !== undefined && progress !== oldProgress) {
            await InterventionLog.create({
                intervention_id: intervention.id,
                user_id: req.user.id,
                action_type: 'progress_updated',
                description: `Progression mise à jour de ${oldProgress}% à ${progress}%`,
                previous_value: oldProgress.toString(),
                new_value: progress.toString()
            });
        }

        // Notifier l'agent si le progrès a changé
        if (progress !== undefined && progress !== oldProgress && intervention.equipment?.received_by) {
            await createNotification({
                user_id: intervention.equipment.received_by,
                type: 'intervention',
                title: 'Avancement réparation',
                message: `La réparation de votre équipement ${intervention.equipment.reference} est à ${progress}%.`,
                link: `/suivi/${intervention.equipment.qr_token}`
            });
        }

        // Diffusion temps-réel de la mise à jour
        if (socketService.getIo()) {
            socketService.broadcast('intervention:updated', { id: intervention.id, progress });
        }

        res.status(200).json({ success: true, data: intervention });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mise à jour globale d'une intervention (Assignation, Priorité, Notes)
 * PUT /api/v1/interventions/:id
 */
const updateIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const { technician_id, priority, actions_performed, result_notes } = req.body;

        const intervention = await Intervention.findByPk(id);

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        const oldTechnician = intervention.technician_id;
        const oldPriority = intervention.priority;

        await intervention.update({
            technician_id: technician_id || intervention.technician_id,
            priority: priority || intervention.priority,
            actions_performed: actions_performed || intervention.actions_performed,
            result_notes: result_notes !== undefined ? result_notes : intervention.result_notes
        });

        if (technician_id && technician_id !== oldTechnician) {
            await InterventionLog.create({
                intervention_id: intervention.id,
                user_id: req.user.id,
                action_type: 'assigned',
                description: 'Intervention réassignée à un nouveau technicien',
                previous_value: oldTechnician,
                new_value: technician_id
            });
        }

        // Diffusion temps-réel de la mise à jour (incluant réassignation)
        if (socketService.getIo()) {
            socketService.broadcast('intervention:updated', { id: intervention.id, technician_id });
        }

        res.status(200).json({ success: true, data: intervention });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Démarrer une intervention
 */
const startIntervention = async (req, res) => {
    try {
        const intervention = await Intervention.findByPk(req.params.id, {
            include: [{ model: Equipment, as: 'equipment' }]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        await intervention.update({
            status: 'in_progress',
            started_at: new Date(),
            progress: 5
        });

        // Mettre à jour l'équipement
        await intervention.equipment.update({ status: 'in_repair' });

        await InterventionLog.create({
            intervention_id: intervention.id,
            user_id: req.user.id,
            action_type: 'status_change',
            description: 'Démarrage de l\'intervention',
            previous_value: 'pending',
            new_value: 'in_progress'
        });

        // ✅ Notifier l'agent que l'équipement a été récupéré
        if (intervention.equipment.received_by) {
            try {
                await createNotification({
                    user_id: intervention.equipment.received_by,
                    type: 'intervention',
                    title: '🔧 Équipement récupéré par le technicien',
                    message: `Votre équipement ${intervention.equipment.reference} a été pris en charge. L'intervention a démarré.`,
                    link: `/suivi`
                });
            } catch (notifErr) {
                logger.warn('Erreur notification récupération:', notifErr.message);
            }
        }

        // Diffusion temps-réel
        if (socketService.getIo()) {
            socketService.broadcast('intervention:updated', { id: intervention.id, status: 'in_progress' });
        }

        res.status(200).json({ success: true, message: 'Intervention démarrée' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Marquer une intervention comme complétée
 * Body: { next_action: 'in_transit' | 'waiting_pickup', result_notes?: string }
 */
const completeIntervention = async (req, res) => {
    try {
        const { next_action, result_notes } = req.body;
        const intervention = await Intervention.findByPk(req.params.id, {
            include: [{ model: Equipment, as: 'equipment' }]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        // Déterminer le statut de l'équipement
        const equipmentStatus = next_action === 'in_transit' ? 'in_transit' : 'waiting_pickup';
        const statusLabel = next_action === 'in_transit' ? 'en transit vers l\'agence' : 'prêt à être récupéré';

        await intervention.update({
            status: 'completed',
            completed_at: new Date(),
            progress: 100,
            result_notes: result_notes || intervention.result_notes,
            total_duration_minutes: intervention.started_at
                ? Math.round((Date.now() - new Date(intervention.started_at).getTime()) / 60000)
                : null
        });

        // Mettre à jour l'équipement
        await intervention.equipment.update({ status: equipmentStatus });

        await InterventionLog.create({
            intervention_id: intervention.id,
            user_id: req.user.id,
            action_type: 'status_change',
            description: `Intervention complétée — équipement ${statusLabel}`,
            previous_value: 'in_progress',
            new_value: 'completed'
        });

        // Notifier l'agent
        if (intervention.equipment.received_by) {
            await createNotification({
                user_id: intervention.equipment.received_by,
                type: 'intervention',
                title: next_action === 'in_transit'
                    ? '🚚 Équipement en transit'
                    : '✅ Équipement prêt à récupérer',
                message: next_action === 'in_transit'
                    ? `L'équipement ${intervention.equipment.reference} est en cours d'acheminement vers votre agence.`
                    : `L'équipement ${intervention.equipment.reference} est prêt. Vous pouvez venir le récupérer.`,
                link: `/suivi`
            });
        }

        // Diffusion temps-réel
        if (socketService.getIo()) {
            socketService.broadcast('intervention:updated', { id: intervention.id, status: 'completed' });
            socketService.broadcast('equipment:status_updated', {
                equipmentId: intervention.equipment.id,
                status: equipmentStatus
            });
        }

        res.status(200).json({ success: true, message: `Intervention terminée — équipement ${statusLabel}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Contrôle qualité
 */
const qualityCheck = async (req, res) => {
    try {
        const { quality_check_passed, quality_check_notes } = req.body;
        const intervention = await Intervention.findByPk(req.params.id, {
            include: [{ model: Equipment, as: 'equipment' }]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        await intervention.update({
            quality_check_passed,
            quality_check_notes,
            quality_checked_by: req.user.id
        });

        const newStatus = quality_check_passed ? 'repaired' : 'in_repair';
        await intervention.equipment.update({ status: newStatus });

        // Notifier l'agent
        if (intervention.equipment.received_by) {
            await createNotification({
                user_id: intervention.equipment.received_by,
                type: 'intervention',
                title: quality_check_passed ? 'Équipement prêt' : 'Réparation en cours',
                message: quality_check_passed
                    ? `Votre équipement ${intervention.equipment.reference} a passé le contrôle qualité et est prêt.`
                    : `Le contrôle qualité a révélé des points à revoir sur votre équipement ${intervention.equipment.reference}.`,
                link: `/suivi/${intervention.equipment.qr_token}`
            });
        }

        res.status(200).json({ success: true, data: intervention });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getInterventionsStats = async (req, res) => {
    try {
        const statsByStatus = await Intervention.findAll({
            attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
            group: ['status']
        });
        const total = await Intervention.count();
        res.status(200).json({ success: true, data: { total, statsByStatus } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les interventions d'un équipement
 */
const getInterventionsByEquipment = async (req, res) => {
    try {
        const interventions = await Intervention.findAll({
            where: { equipment_id: req.params.equipmentId },
            include: [{ model: User, as: 'technician', attributes: ['first_name', 'last_name'] }],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json({ success: true, data: interventions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les interventions d'un technicien
 */
const getInterventionsByTechnician = async (req, res) => {
    try {
        const interventions = await Intervention.findAll({
            where: { technician_id: req.params.technicianId },
            include: [{ model: Equipment, as: 'equipment' }],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json({ success: true, data: interventions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Avancer d'une étape dans le processus de maintenance
 * PATCH /api/v1/interventions/:id/advance
 */
const advanceInterventionStep = async (req, res) => {
    try {
        const { id } = req.params;
        const intervention = await Intervention.findByPk(id, {
            include: [{ model: Equipment, as: 'equipment' }]
        });

        if (!intervention) return res.status(404).json({ success: false, message: 'Intervention non trouvée' });

        const steps = [
            { label: 'Pris en charge', progress: 10, msg: 'réceptionné et en attente d\'expertise' },
            { label: 'Expertise & Démontage', progress: 30, msg: 'en cours d\'expertise technique (démontage)' },
            { label: 'Réparation Active', progress: 60, msg: 'en cours de réparation active' },
            { label: 'Tests & Calibration', progress: 85, msg: 'en phase de tests et de calibration' },
            { label: 'Nettoyage & Remontage', progress: 100, msg: 'réparé, en cours de remontage et nettoyage final' }
        ];

        const nextStep = (intervention.maintenance_step || 0) + 1;

        if (nextStep > steps.length) {
            return res.status(400).json({ success: false, message: 'Processus déjà terminé' });
        }

        const stepInfo = steps[nextStep - 1];

        await intervention.update({
            maintenance_step: nextStep,
            progress: stepInfo.progress,
            status: 'in_progress',
            started_at: intervention.started_at || new Date()
        });

        // Mettre à jour l'équipement
        if (intervention.equipment) {
            await intervention.equipment.update({ status: 'in_repair' });

            await InterventionLog.create({
                intervention_id: intervention.id,
                user_id: req.user.id,
                action_type: 'step_advanced',
                description: `Étape ${nextStep} : ${stepInfo.label}`,
                previous_value: (nextStep - 1).toString(),
                new_value: nextStep.toString()
            });

            // Notifier l'agent
            if (intervention.equipment.received_by) {
                const { createNotification } = require('../services/notificationService');
                await createNotification({
                    user_id: intervention.equipment.received_by,
                    type: 'intervention',
                    title: `Étape ${nextStep} : ${stepInfo.label}`,
                    message: `Votre équipement ${intervention.equipment.reference} est ${stepInfo.msg}.`,
                    link: `/suivi/${intervention.equipment.qr_token}`
                });
            }

            // Diffuser en temps réel
            const socketService = require('../services/socketService');
            if (socketService) {
                socketService.broadcast('intervention:progress_updated', {
                    interventionId: intervention.id,
                    equipmentId: intervention.equipment.id,
                    progress: stepInfo.progress,
                    step: nextStep,
                    stepLabel: stepInfo.label
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Étape ${nextStep} validée : ${stepInfo.label}`,
            data: intervention
        });

    } catch (error) {
        logger.error('Erreur avancement intervention:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createIntervention,
    getAllInterventions,
    getInterventionById,
    updateIntervention,
    updateInterventionProgress,
    startIntervention,
    completeIntervention,
    qualityCheck,
    getInterventionsStats,
    getInterventionsByEquipment,
    getInterventionsByTechnician,
    advanceInterventionStep
};
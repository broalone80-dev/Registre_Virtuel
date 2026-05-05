/**
 * CONTRÔLEUR EQUIPMENT
 * Gestion complète du cycle de vie des équipements
 * CŒUR DU PROJET - Senior implementation
 */

const { Equipment, Depositor, Agency, EquipmentType, User, Diagnostic, Intervention, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const socketService = require('../services/socketService');

/**
 * Générer une référence unique pour l'équipement
 * Utilise une transaction avec verrouillage pour éviter les doublons sous charge
 */
const generateEquipmentReference = async (transaction) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `REF-${year}${month}${day}-`;

    const [results] = await sequelize.query(
        `SELECT COUNT(*) as count FROM equipments WHERE reference LIKE :prefix FOR UPDATE`,
        { replacements: { prefix: `${prefix}%` }, transaction }
    );

    const count = results[0]?.count || 0;
    const number = String(count + 1).padStart(5, '0');
    return `${prefix}${number}`;
};

/**
 * Déposer un nouvel équipement
 * POST /api/v1/equipments
 * Accepte type_id (UUID) OU equipment_type (string) pour auto-résolution
 * Accepte depositor_id (UUID) OU depositor_name/depositor_phone pour auto-création
 */
const createEquipment = async (req, res) => {
    try {
        const {
            type_id,
            equipment_type,
            agency_id,
            depositor_id,
            depositor_name,
            depositor_phone,
            brand,
            model,
            serial_number,
            problem_description,
            priority,
            accessories
        } = req.body;

        // Vérifier que l'agence existe
        const agency = await Agency.findByPk(agency_id);
        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Résoudre le type d'équipement
        let resolvedTypeId = type_id;
        if (!resolvedTypeId && equipment_type) {
            // D'abord chercher par nom
            let eqType = await EquipmentType.findOne({ where: { name: equipment_type } });
            if (!eqType) {
                // Générer un code unique à partir du nom
                const baseCode = equipment_type
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '_')
                    .substring(0, 15);
                const codeCount = await EquipmentType.count({ where: { code: { [Op.like]: `${baseCode}%` } } });
                const code = codeCount > 0 ? `${baseCode}_${codeCount + 1}` : baseCode;

                eqType = await EquipmentType.create({
                    name: equipment_type,
                    code: code.substring(0, 20),
                    category: 'informatique'
                });
            }
            resolvedTypeId = eqType.id;
        }

        // Résoudre le dépositaire
        let resolvedDepositorId = depositor_id;
        if (!resolvedDepositorId && depositor_name) {
            // Chercher un dépositaire existant par nom+téléphone dans la même agence
            const existingDepositor = await Depositor.findOne({
                where: {
                    agency_id,
                    [Op.or]: [
                        ...(depositor_phone ? [{ phone: depositor_phone }] : []),
                        {
                            [Op.and]: [
                                { first_name: depositor_name.split(' ')[0] || depositor_name },
                                { last_name: depositor_name.split(' ').slice(1).join(' ') || '' }
                            ]
                        }
                    ]
                }
            });

            if (existingDepositor) {
                resolvedDepositorId = existingDepositor.id;
            } else {
                // Créer un nouveau dépositaire
                const nameParts = depositor_name.split(' ');
                const newDepositor = await Depositor.create({
                    first_name: nameParts[0] || depositor_name,
                    last_name: nameParts.slice(1).join(' ') || '-',
                    phone: depositor_phone || '',
                    agency_id
                });
                resolvedDepositorId = newDepositor.id;
            }
        }

        // Générer la référence unique dans une transaction pour éviter les doublons
        const t = await sequelize.transaction();
        let equipment;
        try {
            const reference = await generateEquipmentReference(t);

            // Créer l'équipement avec qr_token auto-généré
            equipment = await Equipment.create({
                reference,
                type_id: resolvedTypeId || null,
                agency_id,
                depositor_id: resolvedDepositorId || null,
                received_by: req.user.id,
                brand,
                model,
                serial_number,
                problem_description: problem_description || 'Aucune description fournie',
                priority: priority || 'normal',
                accessories: typeof accessories === 'string' ? [accessories] : accessories,
                status: 'received',
                received_at: new Date(),
                sla_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                qr_token: uuidv4()
            }, { transaction: t });

            await t.commit();
        } catch (txErr) {
            await t.rollback();
            throw txErr;
        }

        // Notifier les techniciens (ils doivent prendre en charge l'équipement)
        const { notifyTechnicians, notifyManagers, notifyAdmins } = require('../services/notificationService');
        try {
            await notifyTechnicians({
                type: 'equipment',
                title: '📦 Nouveau dépôt à prendre en charge',
                message: `Équipement ${reference} (${brand || ''} ${model || ''}) déposé. Action requise.`,
                link: `/equipments`
            });
            await notifyAdmins({
                type: 'equipment',
                title: 'Nouveau dépôt enregistré',
                message: `L'équipement ${reference} (${brand || ''} ${model || ''}) a été déposé à l'agence ${agency.name}.`,
                link: `/equipments`
            });
        } catch (notifErr) {
            logger.warn('Erreur notification dépôt:', notifErr.message);
        }

        // Incrémenter le compteur du dépositaire si présent
        if (resolvedDepositorId) {
            const depositor = await Depositor.findByPk(resolvedDepositorId);
            if (depositor) await depositor.increment('total_deposits');
        }

        // Diffusion temps-réel de la création (PHASE 3 - Targeted rooms)
        if (socketService && socketService.getIo()) {
            try {
                // Alert the agency
                if (socketService.toAgency) {
                    socketService.toAgency(agency_id, 'equipment:created', {
                        id: equipment.id,
                        reference: equipment.reference,
                        agency_id
                    });
                } else {
                    // Fallback to broadcast
                    socketService.broadcast('equipment:created', { id: equipment.id, reference: equipment.reference });
                }

                // Alert admins and managers
                if (socketService.toRoles) {
                    socketService.toRoles(['admin', 'super_admin', 'manager'], 'equipment:created', {
                        id: equipment.id,
                        reference: equipment.reference,
                        brand,
                        model
                    });
                }
            } catch (sockErr) {
                logger.warn('Socket broadcast error:', sockErr.message);
            }
        }

        logger.info(`Nouvel équipement déposé: ${reference} - ${brand} ${model} - Agence: ${agency.code}`);

        res.status(201).json({
            success: true,
            message: 'Équipement déposé avec succès',
            data: await equipment.reload({
                include: [
                    { model: EquipmentType, as: 'type' },
                    { model: Agency, as: 'agency' },
                    { model: Depositor, as: 'depositor' }
                ]
            })
        });

    } catch (error) {
        logger.error('Erreur création équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du dépôt de l\'équipement',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les équipements avec filtres avancés
 * GET /api/v1/equipments
 */
const getAllEquipments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            agency_id,
            depositor_id,
            type_id,
            search,
            sortBy = 'received_at',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        if (agency_id) {
            where.agency_id = agency_id;
        }

        if (depositor_id) {
            where.depositor_id = depositor_id;
        }

        if (type_id) {
            where.type_id = type_id;
        }

        if (req.query.received_by) {
            where.received_by = req.query.received_by;
        }

        if (req.query.assigned_technician_id) {
            where.assigned_technician_id = req.query.assigned_technician_id;
        }

        if (search) {
            where[Op.or] = [
                { reference: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } },
                { model: { [Op.like]: `%${search}%` } },
                { serial_number: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows: equipments } = await Equipment.findAndCountAll({
            where,
            include: [
                { model: EquipmentType, as: 'type', attributes: ['id', 'name'] },
                { model: Agency, as: 'agency', attributes: ['id', 'code', 'name'] },
                { model: Depositor, as: 'depositor', attributes: ['id', 'first_name', 'last_name'] },
                { model: User, as: 'assignedTechnician', attributes: ['id', 'first_name', 'last_name'] },
                { model: Intervention, as: 'interventions', attributes: ['id', 'progress', 'maintenance_step', 'status'], required: false }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            subQuery: false
        });

        res.status(200).json({
            success: true,
            data: equipments,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération équipements:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des équipements',
            error: error.message
        });
    }
};

/**
 * Récupérer un équipement par ID avec tout son historique
 * GET /api/v1/equipments/:id
 */
const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await Equipment.findByPk(id, {
            include: [
                { model: EquipmentType, as: 'type' },
                { model: Agency, as: 'agency' },
                { model: Depositor, as: 'depositor' },
                { model: User, as: 'assignedTechnician', attributes: ['id', 'first_name', 'last_name'] },
                {
                    model: Diagnostic,
                    as: 'diagnostics',
                    include: [
                        { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name'] }
                    ]
                },
                {
                    model: Intervention,
                    as: 'interventions',
                    include: [
                        { model: User, as: 'technician', attributes: ['id', 'first_name', 'last_name'] }
                    ]
                }
            ]
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });

    } catch (error) {
        logger.error('Erreur récupération équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'équipement',
            error: error.message
        });
    }
};

/**
 * Changer le statut d'un équipement (workflow)
 * PATCH /api/v1/equipments/:id/status
 */
const changeEquipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            'received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval',
            'waiting_parts', 'in_repair', 'quality_check', 'repaired',
            'unrepairable', 'waiting_pickup', 'delivered', 'archived'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}`
            });
        }

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        const oldStatus = equipment.status;
        const updateData = { status };

        // Ajouter des timestamps selon le statut
        if (status === 'delivered') {
            updateData.delivered_at = new Date();
        }
        if (status === 'in_repair') {
            updateData.estimated_completion = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 jours
        }
        if (status === 'completed' || status === 'repaired') {
            updateData.completed_at = new Date();
        }

        await equipment.update(updateData);

        // Diffusion temps-réel du changement de statut (PHASE 3 - Targeted rooms)
        if (socketService && socketService.getIo()) {
            try {
                // Alert equipment viewers
                if (socketService.toEquipment) {
                    socketService.toEquipment(id, 'equipment:status_updated', {
                        id: equipment.id,
                        status,
                        reference: equipment.reference
                    });
                }
                // Alert agency
                if (socketService.toAgency) {
                    socketService.toAgency(equipment.agency_id, 'equipment:updated', { id: equipment.id, status });
                }
                // Alert technicians and managers
                if (socketService.toRoles) {
                    socketService.toRoles(['technician', 'manager', 'admin'], 'equipment:updated', { id: equipment.id, status });
                }
            } catch (sockErr) {
                logger.warn('Socket broadcast error:', sockErr.message);
            }
        }

        logger.info(`Statut équipement changé: ${equipment.reference} - ${oldStatus} → ${status}`);

        res.status(200).json({
            success: true,
            message: `Statut mis à jour: ${oldStatus} → ${status}`,
            data: equipment
        });

    } catch (error) {
        logger.error('Erreur changement statut:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de statut',
            error: error.message
        });
    }
};

/**
 * Assigner un technicien à un équipement
 * PATCH /api/v1/equipments/:id/assign
 */
const assignTechnician = async (req, res) => {
    try {
        const { id } = req.params;
        const { technician_id } = req.body;

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        const technician = await User.findByPk(technician_id);
        if (!technician || technician.role !== 'technician') {
            return res.status(404).json({
                success: false,
                message: 'Technicien non trouvé ou rôle invalide'
            });
        }

        await equipment.update({ assigned_technician_id: technician_id });

        // Diffusion temps-réel de l'assignation (PHASE 3 - Targeted rooms)
        if (socketService && socketService.getIo()) {
            try {
                // Alert assigned technician directly
                socketService.toUser(technician_id, 'technician:assigned', {
                    id: equipment.id,
                    reference: equipment.reference,
                    brand: equipment.brand,
                    model: equipment.model
                });
                // Alert equipment viewers
                if (socketService.toEquipment) {
                    socketService.toEquipment(id, 'equipment:updated', { id: equipment.id, assigned_technician_id: technician_id });
                }
                // Alert managers and admins
                if (socketService.toRoles) {
                    socketService.toRoles(['manager', 'admin'], 'equipment:assigned', { id: equipment.id, technician_id });
                }
            } catch (sockErr) {
                logger.warn('Socket assignment error:', sockErr.message);
            }
        }

        logger.info(`Technicien assigné à ${equipment.reference}: ${technician.email}`);

        res.status(200).json({
            success: true,
            message: 'Technicien assigné avec succès',
            data: equipment
        });

    } catch (error) {
        logger.error('Erreur assignation technicien:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation du technicien',
            error: error.message
        });
    }
};

/**
 * Mettre à jour les informations d'un équipement
 * PUT /api/v1/equipments/:id
 */
const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, serial_number, problem_description, priority, accessories } = req.body;

        const equipment = await Equipment.findByPk(id);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        await equipment.update({
            brand: brand || equipment.brand,
            model: model || equipment.model,
            serial_number: serial_number || equipment.serial_number,
            problem_description: problem_description || equipment.problem_description,
            priority: priority || equipment.priority,
            accessories: accessories || equipment.accessories
        });

        // Diffusion temps-réel de la mise à jour
        if (socketService.getIo()) {
            socketService.broadcast('equipment:updated', { id: equipment.id });
        }

        logger.info(`Équipement mis à jour: ${equipment.reference}`);

        res.status(200).json({
            success: true,
            message: 'Équipement mis à jour avec succès',
            data: equipment
        });

    } catch (error) {
        logger.error('Erreur mise à jour équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'équipement',
            error: error.message
        });
    }
};

/**
 * Récupérer les équipements par statut (dashboard)
 * GET /api/v1/equipments/status/:status
 */
const getEquipmentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const { count, rows: equipments } = await Equipment.findAndCountAll({
            where: { status },
            include: [
                { model: Agency, as: 'agency', attributes: ['code', 'name'] },
                { model: Depositor, as: 'depositor', attributes: ['first_name', 'last_name'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['received_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            status,
            data: equipments,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération équipements par statut:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des équipements',
            error: error.message
        });
    }
};

/**
 * Statistiques des équipements (dashboard)
 * GET /api/v1/equipments/stats/overview
 */
const getEquipmentsStats = async (req, res) => {
    try {
        const { agency_id } = req.query;

        const where = {};
        if (agency_id) {
            where.agency_id = agency_id;
        }

        // Compter par statut
        const statsByStatus = await Equipment.findAll({
            where,
            attributes: [
                'status',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['status']
        });

        // Compter par priorité
        const statsByPriority = await Equipment.findAll({
            where,
            attributes: [
                'priority',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['priority']
        });

        // Totaux
        const totalEquipments = await Equipment.count({ where });
        const deliveredEquipments = await Equipment.count({
            where: { ...where, status: 'delivered' }
        });
        const unreparableEquipments = await Equipment.count({
            where: { ...where, status: 'unrepairable' }
        });

        res.status(200).json({
            success: true,
            data: {
                total_equipments: totalEquipments,
                delivered_equipments: deliveredEquipments,
                unrepairable_equipments: unreparableEquipments,
                stats_by_status: statsByStatus,
                stats_by_priority: statsByPriority
            }
        });

    } catch (error) {
        logger.error('Erreur stats équipements:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * Récupérer un équipement par son token de QR Code (public)
 * GET /api/v1/equipments/scan/:token
 */
const getEquipmentByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const equipment = await Equipment.findOne({
            where: { qr_token: token },
            include: [
                { model: EquipmentType, as: 'type' },
                { model: Agency, as: 'agency' },
                { model: Depositor, as: 'depositor' }
            ]
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé via ce code'
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });

    } catch (error) {
        logger.error('Erreur scan équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du scan de l\'équipement',
            error: error.message
        });
    }
};

/**
 * Supprimer définitivement un équipement
 * DELETE /api/v1/equipments/:id
 */
const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await Equipment.findByPk(id, {
            include: [
                { model: Intervention, as: 'interventions' },
                { model: Diagnostic, as: 'diagnostics' }
            ]
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Équipement non trouvé'
            });
        }

        const reference = equipment.reference;

        // Supprimer les dépendances en cascade
        if (equipment.diagnostics?.length) {
            await Diagnostic.destroy({ where: { equipment_id: id } });
        }
        if (equipment.interventions?.length) {
            const { InterventionLog, Message } = require('../models');
            for (const intervention of equipment.interventions) {
                await InterventionLog.destroy({ where: { intervention_id: intervention.id } });
                await Message.destroy({ where: { intervention_id: intervention.id } });
            }
            await Intervention.destroy({ where: { equipment_id: id } });
        }

        // Supprimer les messages liés directement à l'équipement
        const { Message } = require('../models');
        await Message.destroy({ where: { equipment_id: id } });

        // Supprimer l'équipement
        await equipment.destroy();

        // Socket temps-réel
        if (socketService?.getIo()) {
            socketService.broadcast('equipment:deleted', { equipmentId: id, reference });
        }

        logger.info(`Équipement ${reference} supprimé définitivement par ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: `Équipement ${reference} supprimé définitivement`
        });

    } catch (error) {
        logger.error('Erreur suppression équipement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'équipement',
            error: error.message
        });
    }
};

/**
     * Agent confirme la récupération d'un équipement
     * PATCH /api/v1/equipments/:id/confirm-pickup
     */
const confirmPickup = async (req, res) => {
    try {
        const equipment = await Equipment.findByPk(req.params.id, {
            include: [
                { model: Agency, as: 'agency' },
                { model: User, as: 'assignedTechnician' }
            ]
        });

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Équipement non trouvé' });
        }

        if (!['waiting_pickup', 'in_transit'].includes(equipment.status)) {
            return res.status(400).json({
                success: false,
                message: `L'équipement n'est pas en attente de récupération (statut actuel: ${equipment.status})`
            });
        }

        const previousStatus = equipment.status;

        // Mettre à jour l'équipement — disponible (actif dans le parc agence) + retirer du parc technicien
        await equipment.update({
            status: 'available',
            assigned_technician_id: null
        });

        // Notifier le technicien que l'équipement a été récupéré
        if (equipment.assignedTechnician) {
            const { createNotification } = require('../services/notificationService');
            await createNotification({
                user_id: equipment.assignedTechnician.id,
                type: 'equipment',
                title: '📦 Équipement récupéré par l\'agent',
                message: `L'équipement ${equipment.reference} a été récupéré et réintégré au parc de l'agence.`,
                link: `/equipments`
            });
        }

        // Socket temps-réel
        if (socketService.getIo()) {
            socketService.broadcast('equipment:status_updated', {
                equipmentId: equipment.id,
                status: 'available'
            });
        }

        logger.info(`Équipement ${equipment.reference} récupéré par agent ${req.user.id} → statut: available`);

        res.status(200).json({
            success: true,
            message: 'Récupération confirmée — équipement réintégré au parc',
            data: equipment
        });
    } catch (error) {
        logger.error('Erreur confirmPickup:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createEquipment,
    getAllEquipments,
    getEquipmentById,
    getEquipmentByToken,
    changeEquipmentStatus,
    assignTechnician,
    updateEquipment,
    getEquipmentsByStatus,
    getEquipmentsStats,
    confirmPickup,
    deleteEquipment
};
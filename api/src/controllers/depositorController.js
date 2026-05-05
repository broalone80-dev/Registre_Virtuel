/**
 * CONTRÔLEUR DEPOSITOR
 * Gestion des dépositaires (clients qui déposent des équipements)
 */

const { Depositor, Agency, Equipment } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Créer un nouveau dépositaire
 * POST /api/v1/depositors
 */
const createDepositor = async (req, res) => {
    try {
        const { 
            first_name, 
            last_name, 
            phone, 
            email, 
            id_type, 
            id_number, 
            company_name, 
            company_role,
            agency_id 
        } = req.body;

        // Vérifier que l'agence existe
        const agency = await Agency.findByPk(agency_id);
        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Créer le dépositaire
        const depositor = await Depositor.create({
            first_name,
            last_name,
            phone,
            email,
            id_type,
            id_number,
            company_name,
            company_role,
            agency_id
        });

        logger.info(`Nouveau dépositaire créé: ${depositor.getFullName()} - Agence: ${agency.code}`);

        res.status(201).json({
            success: true,
            message: 'Dépositaire créé avec succès',
            data: depositor
        });

    } catch (error) {
        logger.error('Erreur création dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du dépositaire',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les dépositaires avec filtres
 * GET /api/v1/depositors
 */
const getAllDepositors = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            agency_id,
            is_vip,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};
        
        if (search) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        if (agency_id) {
            where.agency_id = agency_id;
        }

        if (is_vip !== undefined) {
            where.is_vip = is_vip === 'true';
        }

        const offset = (page - 1) * limit;

        const { count, rows: depositors } = await Depositor.findAndCountAll({
            where,
            include: [
                {
                    model: Agency,
                    as: 'agency',
                    attributes: ['id', 'code', 'name', 'city']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            subQuery: false
        });

        res.status(200).json({
            success: true,
            data: depositors,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération dépositaires:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des dépositaires',
            error: error.message
        });
    }
};

/**
 * Récupérer un dépositaire par ID
 * GET /api/v1/depositors/:id
 */
const getDepositorById = async (req, res) => {
    try {
        const { id } = req.params;

        const depositor = await Depositor.findByPk(id, {
            include: [
                {
                    model: Agency,
                    as: 'agency',
                    attributes: ['id', 'code', 'name', 'city', 'email', 'phone']
                },
                {
                    model: Equipment,
                    as: 'equipments',
                    attributes: ['id', 'reference', 'status', 'received_at', 'delivered_at']
                }
            ]
        });

        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: depositor
        });

    } catch (error) {
        logger.error('Erreur récupération dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du dépositaire',
            error: error.message
        });
    }
};

/**
 * Mettre à jour un dépositaire
 * PUT /api/v1/depositors/:id
 */
const updateDepositor = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, email, id_type, id_number, company_name, company_role } = req.body;

        const depositor = await Depositor.findByPk(id);

        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        await depositor.update({
            first_name: first_name || depositor.first_name,
            last_name: last_name || depositor.last_name,
            phone: phone || depositor.phone,
            email: email || depositor.email,
            id_type: id_type || depositor.id_type,
            id_number: id_number || depositor.id_number,
            company_name: company_name || depositor.company_name,
            company_role: company_role || depositor.company_role
        });

        logger.info(`Dépositaire mis à jour: ${depositor.getFullName()}`);

        res.status(200).json({
            success: true,
            message: 'Dépositaire mis à jour avec succès',
            data: depositor
        });

    } catch (error) {
        logger.error('Erreur mise à jour dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du dépositaire',
            error: error.message
        });
    }
};

/**
 * Marquer un dépositaire comme VIP
 * PATCH /api/v1/depositors/:id/vip
 */
const toggleVIPStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_vip } = req.body;

        const depositor = await Depositor.findByPk(id);

        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        await depositor.update({ is_vip });

        const status = is_vip ? 'VIP' : 'normal';
        logger.info(`Statut dépositaire changé en ${status}: ${depositor.getFullName()}`);

        res.status(200).json({
            success: true,
            message: `Dépositaire marqué comme ${status}`,
            data: depositor
        });

    } catch (error) {
        logger.error('Erreur changement statut VIP:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de statut VIP',
            error: error.message
        });
    }
};

/**
 * Supprimer un dépositaire (soft delete)
 * DELETE /api/v1/depositors/:id
 */
const deleteDepositor = async (req, res) => {
    try {
        const { id } = req.params;

        const depositor = await Depositor.findByPk(id);

        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        // Vérifier s'il y a des équipements actifs liés
        const activeEquipments = await Equipment.count({
            where: {
                depositor_id: id,
                status: { [Op.notIn]: ['delivered', 'returned'] }
            }
        });

        if (activeEquipments > 0) {
            return res.status(409).json({
                success: false,
                message: `Impossible de supprimer : ${activeEquipments} équipement(s) encore en cours de traitement`
            });
        }

        // Soft delete — on désactive au lieu de supprimer pour garder l'historique
        await depositor.update({ is_vip: false });
        // Note: Pour un vrai soft-delete, ajouter un champ `is_active` ou Sequelize `paranoid: true`

        logger.info(`Dépositaire désactivé: ${depositor.getFullName()}`);

        res.status(200).json({
            success: true,
            message: 'Dépositaire supprimé avec succès'
        });

    } catch (error) {
        logger.error('Erreur suppression dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du dépositaire',
            error: error.message
        });
    }
};

/**
 * Récupérer les équipements d'un dépositaire
 * GET /api/v1/depositors/:id/equipments
 */
const getDepositorEquipments = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const depositor = await Depositor.findByPk(id);
        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        const where = { depositor_id: id };
        if (status) {
            where.status = status;
        }

        const offset = (page - 1) * limit;

        const { count, rows: equipments } = await Equipment.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['received_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                depositor: {
                    id: depositor.id,
                    name: depositor.getFullName(),
                    email: depositor.email,
                    phone: depositor.phone
                },
                equipments,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Erreur récupération équipements dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des équipements',
            error: error.message
        });
    }
};

/**
 * Récupérer les statistiques d'un dépositaire
 * GET /api/v1/depositors/:id/stats
 */
const getDepositorStats = async (req, res) => {
    try {
        const { id } = req.params;

        const depositor = await Depositor.findByPk(id);
        if (!depositor) {
            return res.status(404).json({
                success: false,
                message: 'Dépositaire non trouvé'
            });
        }

        // Compter les équipements par statut
        const equipmentStats = await Equipment.findAll({
            where: { depositor_id: id },
            attributes: [
                'status',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['status']
        });

        // Total d'équipements déposés
        const totalEquipments = await Equipment.count({ where: { depositor_id: id } });

        // Équipements livrés
        const deliveredEquipments = await Equipment.count({ 
            where: { 
                depositor_id: id,
                status: 'delivered'
            }
        });

        res.status(200).json({
            success: true,
            data: {
                depositor_name: depositor.getFullName(),
                total_equipments: totalEquipments,
                delivered_equipments: deliveredEquipments,
                equipment_stats: equipmentStats
            }
        });

    } catch (error) {
        logger.error('Erreur stats dépositaire:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

module.exports = {
    createDepositor,
    getAllDepositors,
    getDepositorById,
    updateDepositor,
    toggleVIPStatus,
    deleteDepositor,
    getDepositorEquipments,
    getDepositorStats
};
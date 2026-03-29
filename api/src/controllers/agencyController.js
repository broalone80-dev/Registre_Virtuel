/**
 * CONTRÔLEUR AGENCIES
 * CRUD des agences Express Union
 */

const { Agency, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Créer une nouvelle agence
 * POST /api/v1/agencies
 */
const createAgency = async (req, res) => {
    try {
        const { code, name, address, city, region, postal_code, phone, email, max_daily_appointments } = req.body;

        // Vérifier si le code existe déjà
        const existingAgency = await Agency.findOne({ where: { code } });
        if (existingAgency) {
            return res.status(400).json({
                success: false,
                message: 'Ce code agence existe déjà'
            });
        }

        // Créer l'agence
        const agency = await Agency.create({
            code,
            name,
            address,
            city,
            region,
            postal_code,
            phone,
            email,
            max_daily_appointments
        });

        logger.info(`Nouvelle agence créée: ${code} - ${name}`);

        res.status(201).json({
            success: true,
            message: 'Agence créée avec succès',
            data: agency
        });

    } catch (error) {
        logger.error('Erreur création agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'agence',
            error: error.message
        });
    }
};

/**
 * Récupérer toutes les agences
 * GET /api/v1/agencies
 */
const getAllAgencies = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, city, is_active } = req.query;

        // Construire les filtres
        const where = {};
        
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } }
            ];
        }

        if (city) {
            where.city = city;
        }

        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        // Pagination
        const offset = (page - 1) * limit;

        const { count, rows: agencies } = await Agency.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: agencies,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération agences:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des agences',
            error: error.message
        });
    }
};

/**
 * Récupérer une agence par ID
 * GET /api/v1/agencies/:id
 */
const getAgencyById = async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'role']
                }
            ]
        });

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: agency
        });

    } catch (error) {
        logger.error('Erreur récupération agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'agence',
            error: error.message
        });
    }
};

/**
 * Mettre à jour une agence
 * PUT /api/v1/agencies/:id
 */
const updateAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Vérifier si le nouveau code existe déjà (si modifié)
        if (updateData.code && updateData.code !== agency.code) {
            const existingAgency = await Agency.findOne({ where: { code: updateData.code } });
            if (existingAgency) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce code agence existe déjà'
                });
            }
        }

        await agency.update(updateData);

        logger.info(`Agence mise à jour: ${agency.code}`);

        res.status(200).json({
            success: true,
            message: 'Agence mise à jour avec succès',
            data: agency
        });

    } catch (error) {
        logger.error('Erreur mise à jour agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'agence',
            error: error.message
        });
    }
};

/**
 * Supprimer une agence (soft delete)
 * DELETE /api/v1/agencies/:id
 */
const deleteAgency = async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Soft delete - désactiver l'agence
        await agency.update({ is_active: false });

        logger.info(`Agence désactivée: ${agency.code}`);

        res.status(200).json({
            success: true,
            message: 'Agence désactivée avec succès'
        });

    } catch (error) {
        logger.error('Erreur suppression agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'agence',
            error: error.message
        });
    }
};

/**
 * Assigner un manager à une agence
 * PATCH /api/v1/agencies/:id/manager
 */
const assignManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { manager_id } = req.body;

        const agency = await Agency.findByPk(id);
        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Vérifier que le manager existe et a le bon rôle
        const manager = await User.findByPk(manager_id);
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (!['admin', 'manager'].includes(manager.role)) {
            return res.status(400).json({
                success: false,
                message: 'L\'utilisateur doit avoir le rôle admin ou manager'
            });
        }

        await agency.update({ manager_id });

        logger.info(`Manager assigné à l'agence ${agency.code}: ${manager.email}`);

        res.status(200).json({
            success: true,
            message: 'Manager assigné avec succès',
            data: agency
        });

    } catch (error) {
        logger.error('Erreur assignation manager:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation du manager',
            error: error.message
        });
    }
};

/**
 * Statistiques d'une agence
 * GET /api/v1/agencies/:id/stats
 */
const getAgencyStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { Equipment, Depositor } = require('../models');

        const agency = await Agency.findByPk(id);
        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        // Compter les équipements par statut
        const equipmentStats = await Equipment.findAll({
            where: { agency_id: id },
            attributes: [
                'status',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['status']
        });

        // Compter les dépositaires
        const depositorsCount = await Depositor.count({ where: { agency_id: id } });

        // Compter les utilisateurs
        const usersCount = await User.count({ where: { agency_id: id } });

        res.status(200).json({
            success: true,
            data: {
                agency: agency.name,
                depositors_count: depositorsCount,
                users_count: usersCount,
                equipment_stats: equipmentStats
            }
        });

    } catch (error) {
        logger.error('Erreur stats agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

module.exports = {
    createAgency,
    getAllAgencies,
    getAgencyById,
    updateAgency,
    deleteAgency,
    assignManager,
    getAgencyStats
};

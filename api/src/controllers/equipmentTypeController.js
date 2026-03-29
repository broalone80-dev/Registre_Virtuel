/**
 * CONTRÔLEUR EQUIPMENT_TYPE
 * Gestion des types d'équipements
 */

const { EquipmentType } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Créer un type d'équipement
 */
const createEquipmentType = async (req, res) => {
    try {
        const { code, name, category, icon, avg_repair_time_hours, diagnostic_checklist } = req.body;

        const existingType = await EquipmentType.findOne({ where: { code } });
        if (existingType) {
            return res.status(400).json({
                success: false,
                message: 'Ce code de type existe déjà'
            });
        }

        const type = await EquipmentType.create({
            code,
            name,
            category,
            icon,
            avg_repair_time_hours,
            diagnostic_checklist
        });

        logger.info(`Nouveau type d'équipement créé: ${code} - ${name}`);

        res.status(201).json({
            success: true,
            message: 'Type d\'équipement créé avec succès',
            data: type
        });

    } catch (error) {
        logger.error('Erreur création type:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du type',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les types
 */
const getAllEquipmentTypes = async (req, res) => {
    try {
        const { search, category, is_active = true } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        const types = await EquipmentType.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: types,
            count: types.length
        });

    } catch (error) {
        logger.error('Erreur récupération types:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des types',
            error: error.message
        });
    }
};

/**
 * Récupérer un type par ID
 */
const getEquipmentTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        const type = await EquipmentType.findByPk(id);

        if (!type) {
            return res.status(404).json({
                success: false,
                message: 'Type d\'équipement non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: type
        });

    } catch (error) {
        logger.error('Erreur récupération type:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du type',
            error: error.message
        });
    }
};

/**
 * Mettre à jour un type
 */
const updateEquipmentType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, icon, avg_repair_time_hours, diagnostic_checklist } = req.body;

        const type = await EquipmentType.findByPk(id);

        if (!type) {
            return res.status(404).json({
                success: false,
                message: 'Type d\'équipement non trouvé'
            });
        }

        await type.update({
            name: name || type.name,
            category: category || type.category,
            icon: icon || type.icon,
            avg_repair_time_hours: avg_repair_time_hours !== undefined ? avg_repair_time_hours : type.avg_repair_time_hours,
            diagnostic_checklist: diagnostic_checklist || type.diagnostic_checklist
        });

        logger.info(`Type mis à jour: ${type.code}`);

        res.status(200).json({
            success: true,
            message: 'Type mis à jour avec succès',
            data: type
        });

    } catch (error) {
        logger.error('Erreur mise à jour type:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du type',
            error: error.message
        });
    }
};

/**
 * Supprimer un type
 */
const deleteEquipmentType = async (req, res) => {
    try {
        const { id } = req.params;

        const type = await EquipmentType.findByPk(id);

        if (!type) {
            return res.status(404).json({
                success: false,
                message: 'Type d\'équipement non trouvé'
            });
        }

        await type.update({ is_active: false });

        logger.info(`Type désactivé: ${type.code}`);

        res.status(200).json({
            success: true,
            message: 'Type supprimé avec succès'
        });

    } catch (error) {
        logger.error('Erreur suppression type:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du type',
            error: error.message
        });
    }
};

module.exports = {
    createEquipmentType,
    getAllEquipmentTypes,
    getEquipmentTypeById,
    updateEquipmentType,
    deleteEquipmentType
};
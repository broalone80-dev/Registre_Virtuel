/**
 * CONTRÔLEUR USERS
 * Gestion complète des utilisateurs avec rôles et permissions
 */

const { User, Agency } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Créer un nouvel utilisateur (Admin/Manager uniquement)
 * POST /api/v1/users
 */
const createUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role, agency_id } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        if (agency_id) {
            const agency = await Agency.findByPk(agency_id);
            if (!agency) {
                return res.status(404).json({
                    success: false,
                    message: 'Agence non trouvée'
                });
            }
        }

        const user = await User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role: role || 'receptionist',
            agency_id
        });

        logger.info(`Nouvel utilisateur créé: ${email} - Rôle: ${user.role}`);

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: user.toSafeObject()
        });

    } catch (error) {
        logger.error('Erreur création utilisateur:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'utilisateur',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les utilisateurs avec filtres avancés
 * GET /api/v1/users
 */
const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            agency_id,
            is_active,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { email: { [Op.like]: `%${search}%` } },
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (agency_id) {
            where.agency_id = agency_id;
        }

        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            where,
            include: [
                {
                    model: Agency,
                    as: 'agency',
                    attributes: ['id', 'code', 'name', 'city']
                }
            ],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            subQuery: false
        });

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur récupération utilisateurs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des utilisateurs',
            error: error.message
        });
    }
};

/**
 * Récupérer un utilisateur par ID
 * GET /api/v1/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            include: [
                {
                    model: Agency,
                    as: 'agency',
                    attributes: ['id', 'code', 'name', 'city', 'email', 'phone']
                }
            ],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        logger.error('Erreur récupération utilisateur:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'utilisateur',
            error: error.message
        });
    }
};

/**
 * Mettre à jour un utilisateur
 * PUT /api/v1/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, avatar_url, agency_id } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (agency_id && agency_id !== user.agency_id) {
            const agency = await Agency.findByPk(agency_id);
            if (!agency) {
                return res.status(404).json({
                    success: false,
                    message: 'Agence non trouvée'
                });
            }
        }

        await user.update({
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            phone: phone !== undefined ? phone : user.phone,
            avatar_url: avatar_url !== undefined ? avatar_url : user.avatar_url,
            agency_id: agency_id || user.agency_id
        });

        logger.info(`Utilisateur mis à jour: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: user.toSafeObject()
        });

    } catch (error) {
        logger.error('Erreur mise à jour utilisateur:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'utilisateur',
            error: error.message
        });
    }
};

/**
 * Changer le mot de passe d'un utilisateur
 * PUT /api/v1/users/:id/password
 */
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        const isValid = await user.verifyPassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        await user.update({ password: newPassword });

        logger.info(`Mot de passe changé pour: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });

    } catch (error) {
        logger.error('Erreur changement mot de passe:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de mot de passe',
            error: error.message
        });
    }
};

/**
 * Changer le rôle d'un utilisateur (Admin uniquement)
 * PATCH /api/v1/users/:id/role
 */
const changeRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['super_admin', 'admin', 'manager', 'technician', 'receptionist'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Rôle invalide. Rôles valides: ${validRoles.join(', ')}`
            });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        const oldRole = user.role;
        await user.update({ role });

        logger.info(`Rôle changé pour ${user.email}: ${oldRole} → ${role}`);

        res.status(200).json({
            success: true,
            message: 'Rôle mis à jour avec succès',
            data: user.toSafeObject()
        });

    } catch (error) {
        logger.error('Erreur changement rôle:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de rôle',
            error: error.message
        });
    }
};

/**
 * Activer/Désactiver un utilisateur
 * PATCH /api/v1/users/:id/status
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        await user.update({ is_active });

        const status = is_active ? 'activé' : 'désactivé';
        logger.info(`Utilisateur ${status}: ${user.email}`);

        res.status(200).json({
            success: true,
            message: `Utilisateur ${status} avec succès`,
            data: user.toSafeObject()
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
 * Supprimer un utilisateur (Hard delete — supprime de la base de données)
 * DELETE /api/v1/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Empêcher la suppression de soi-même
        if (req.user && req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        const email = user.email;
        await user.destroy();

        logger.info(`Utilisateur supprimé définitivement: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé définitivement'
        });

    } catch (error) {
        logger.error('Erreur suppression utilisateur:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'utilisateur',
            error: error.message
        });
    }
};

/**
 * Récupérer les utilisateurs d'une agence spécifique
 * GET /api/v1/users/agency/:agencyId
 */
const getUsersByAgency = async (req, res) => {
    try {
        const { agencyId } = req.params;
        const { role } = req.query;

        const agency = await Agency.findByPk(agencyId);
        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agence non trouvée'
            });
        }

        const where = { agency_id: agencyId };
        if (role) {
            where.role = role;
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['first_name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        logger.error('Erreur récupération utilisateurs agence:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des utilisateurs',
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    changePassword,
    changeRole,
    toggleUserStatus,
    deleteUser,
    getUsersByAgency
};
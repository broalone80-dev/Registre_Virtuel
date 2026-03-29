/**
 * ROUTES USERS
 * /api/v1/users
 * Gestion complète des utilisateurs
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, authorize, validate } = require('../middlewares');
const { registerSchema } = require('../utils/validators');

/**
 * @route   POST /api/v1/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (admin, super_admin)
 */
router.post('/',
    authenticate,
    authorize('admin', 'super_admin'),
    validate(registerSchema),
    userController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    Récupérer tous les utilisateurs avec filtres
 * @access  Private (admin, super_admin, manager)
 */
router.get('/',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (l'utilisateur lui-même ou admin)
 */
router.put('/:id',
    authenticate,
    userController.updateUser
);

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Changer le mot de passe
 * @access  Private (l'utilisateur lui-même ou admin)
 */
router.put('/:id/password',
    authenticate,
    userController.changePassword
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Changer le rôle d'un utilisateur
 * @access  Private (admin, super_admin uniquement)
 */
router.patch('/:id/role',
    authenticate,
    authorize('admin', 'super_admin'),
    userController.changeRole
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Activer/Désactiver un utilisateur
 * @access  Private (admin, super_admin)
 */
router.patch('/:id/status',
    authenticate,
    authorize('admin', 'super_admin'),
    userController.toggleUserStatus
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur (soft delete)
 * @access  Private (admin, super_admin)
 */
router.delete('/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    userController.deleteUser
);

/**
 * @route   GET /api/v1/users/agency/:agencyId
 * @desc    Récupérer les utilisateurs d'une agence
 * @access  Private (authentifié)
 */
router.get('/agency/:agencyId',
    authenticate,
    userController.getUsersByAgency
);

module.exports = router;
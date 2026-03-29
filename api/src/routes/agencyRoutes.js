/**
 * ROUTES AGENCIES
 * /api/v1/agencies
 */

const express = require('express');
const router = express.Router();

const agencyController = require('../controllers/agencyController');
const { authenticate, authorize, validate } = require('../middlewares');
const { agencySchema } = require('../utils/validators');

/**
 * @route   POST /api/v1/agencies
 * @desc    Créer une nouvelle agence
 * @access  Private (admin, super_admin)
 */
router.post('/',
    authenticate,
    authorize('admin', 'super_admin'),
    validate(agencySchema),
    agencyController.createAgency
);

/**
 * @route   GET /api/v1/agencies
 * @desc    Récupérer toutes les agences
 * @access  Public (pour permettre la sélection lors de l'inscription)
 */
router.get('/',
    agencyController.getAllAgencies
);

/**
 * @route   GET /api/v1/agencies/:id
 * @desc    Récupérer une agence par ID
 * @access  Private
 */
router.get('/:id',
    authenticate,
    agencyController.getAgencyById
);

/**
 * @route   PUT /api/v1/agencies/:id
 * @desc    Mettre à jour une agence
 * @access  Private (admin, super_admin, manager)
 */
router.put('/:id',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    validate(agencySchema),
    agencyController.updateAgency
);

/**
 * @route   DELETE /api/v1/agencies/:id
 * @desc    Supprimer une agence (soft delete)
 * @access  Private (admin, super_admin)
 */
router.delete('/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    agencyController.deleteAgency
);

/**
 * @route   PATCH /api/v1/agencies/:id/manager
 * @desc    Assigner un manager à une agence
 * @access  Private (admin, super_admin)
 */
router.patch('/:id/manager',
    authenticate,
    authorize('admin', 'super_admin'),
    agencyController.assignManager
);

/**
 * @route   GET /api/v1/agencies/:id/stats
 * @desc    Statistiques d'une agence
 * @access  Private
 */
router.get('/:id/stats',
    authenticate,
    agencyController.getAgencyStats
);

module.exports = router;

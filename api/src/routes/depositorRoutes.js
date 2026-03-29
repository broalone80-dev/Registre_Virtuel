/**
 * ROUTES DEPOSITORS
 * /api/v1/depositors
 * Gestion des clients/dépositaires
 */

const express = require('express');
const router = express.Router();

const depositorController = require('../controllers/depositorController');
const { authenticate, authorize, validate } = require('../middlewares');
const { depositorSchema } = require('../utils/validators');

/**
 * @route   POST /api/v1/depositors
 * @desc    Créer un nouveau dépositaire
 * @access  Private (authentifié)
 */
router.post('/',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin'),
    validate(depositorSchema),
    depositorController.createDepositor
);

/**
 * @route   GET /api/v1/depositors
 * @desc    Récupérer tous les dépositaires avec filtres
 * @access  Private (authentifié)
 */
router.get('/',
    authenticate,    authorize('receptionist', 'admin', 'super_admin', 'manager'),    depositorController.getAllDepositors
);

/**
 * @route   GET /api/v1/depositors/:id
 * @desc    Récupérer un dépositaire par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin', 'manager'),
    depositorController.getDepositorById
);

/**
 * @route   PUT /api/v1/depositors/:id
 * @desc    Mettre à jour un dépositaire
 * @access  Private (manager, admin)
 */
router.put('/:id',
    authenticate,
    authorize('manager', 'admin', 'super_admin'),
    depositorController.updateDepositor
);

/**
 * @route   PATCH /api/v1/depositors/:id/vip
 * @desc    Marquer/Démarquer un dépositaire comme VIP
 * @access  Private (manager, admin, super_admin)
 */
router.patch('/:id/vip',
    authenticate,
    authorize('manager', 'admin', 'super_admin'),
    depositorController.toggleVIPStatus
);

/**
 * @route   DELETE /api/v1/depositors/:id
 * @desc    Supprimer un dépositaire
 * @access  Private (admin, super_admin)
 */
router.delete('/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    depositorController.deleteDepositor
);

/**
 * @route   GET /api/v1/depositors/:id/equipments
 * @desc    Récupérer les équipements d'un dépositaire
 * @access  Private (receptionist, manager, admin)
 */
router.get('/:id/equipments',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin', 'manager'),
    depositorController.getDepositorEquipments
);

/**
 * @route   GET /api/v1/depositors/:id/stats
 * @desc    Récupérer les statistiques d'un dépositaire
 * @access  Private (manager, admin)
 */
router.get('/:id/stats',
    authenticate,
    authorize('manager', 'admin', 'super_admin'),
    depositorController.getDepositorStats
);

module.exports = router;
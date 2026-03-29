/**
 * ROUTES DIAGNOSTICS
 * /api/v1/diagnostics
 * Gestion des diagnostics d'équipements
 */

const express = require('express');
const router = express.Router();

const diagnosticController = require('../controllers/diagnosticController');
const { authenticate, authorize, validate } = require('../middlewares');
const { diagnosticSchema } = require('../utils/validators');

/**
 * @route   GET /api/v1/diagnostics/stats/overview
 * @desc    Statistiques des diagnostics
 * @access  Private (manager, admin)
 * NOTE: AVANT /:id pour éviter conflit de route
 */
router.get('/stats/overview',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    diagnosticController.getDiagnosticsStats
);

/**
 * @route   GET /api/v1/diagnostics/equipment/:equipmentId
 * @desc    Récupérer les diagnostics d'un équipement
 * @access  Private (authentifié)
 * NOTE: AVANT /:id pour éviter conflit de route
 */
router.get('/equipment/:equipmentId',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    diagnosticController.getDiagnosticsByEquipment
);

/**
 * @route   POST /api/v1/diagnostics
 * @desc    Créer un diagnostic pour un équipement
 * @access  Private (technician, admin, manager)
 */
router.post('/',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    validate(diagnosticSchema),
    diagnosticController.createDiagnostic
);

/**
 * @route   GET /api/v1/diagnostics
 * @desc    Récupérer tous les diagnostics avec filtres
 * @access  Private (authentifié)
 */
router.get('/',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    diagnosticController.getAllDiagnostics
);

/**
 * @route   GET /api/v1/diagnostics/:id
 * @desc    Récupérer un diagnostic par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    diagnosticController.getDiagnosticById
);

/**
 * @route   PUT /api/v1/diagnostics/:id
 * @desc    Mettre à jour un diagnostic
 * @access  Private (technician, admin)
 */
router.put('/:id',
    authenticate,
    authorize('technician', 'admin', 'super_admin'),
    diagnosticController.updateDiagnostic
);

/**
 * @route   PATCH /api/v1/diagnostics/:id/approve
 * @desc    Approuver un diagnostic (client valide le devis)
 * @access  Private (receptionist, admin, super_admin)
 */
router.patch('/:id/approve',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin'),
    diagnosticController.approveDiagnostic
);

/**
 * @route   PATCH /api/v1/diagnostics/:id/complete
 * @desc    Marquer un diagnostic comme terminé explicitement
 * @access  Private (technician, admin)
 */
router.patch('/:id/complete',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    diagnosticController.completeDiagnostic
);

module.exports = router;
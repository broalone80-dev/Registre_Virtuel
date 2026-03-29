/**
 * ROUTES INTERVENTIONS
 * /api/v1/interventions
 * Gestion des interventions/réparations d'équipements
 */

const express = require('express');
const router = express.Router();

const interventionController = require('../controllers/interventionController');
const { authenticate, authorize, validate } = require('../middlewares');
const { interventionSchema } = require('../utils/validators');

/**
 * @route   GET /api/v1/interventions/stats/overview
 * @desc    Statistiques des interventions
 * @access  Private (manager, admin)
 * NOTE: AVANT /:id pour éviter conflit de route
 */
router.get('/stats/overview',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    interventionController.getInterventionsStats
);

/**
 * @route   GET /api/v1/interventions/equipment/:equipmentId
 * @desc    Récupérer les interventions d'un équipement
 * @access  Private (authentifié)
 * NOTE: AVANT /:id pour éviter conflit de route
 */
router.get('/equipment/:equipmentId',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    interventionController.getInterventionsByEquipment
);

/**
 * @route   GET /api/v1/interventions/technician/:technicianId
 * @desc    Récupérer les interventions d'un technicien
 * @access  Private (authentifié)
 * NOTE: AVANT /:id pour éviter conflit de route
 */
router.get('/technician/:technicianId',
    authenticate,
    interventionController.getInterventionsByTechnician
);

/**
 * @route   POST /api/v1/interventions
 * @desc    Créer une intervention sur un équipement
 * @access  Private (technician, manager, admin)
 */
router.post('/',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    validate(interventionSchema),
    interventionController.createIntervention
);

/**
 * @route   GET /api/v1/interventions
 * @desc    Récupérer toutes les interventions avec filtres
 * @access  Private (authentifié)
 */
router.get('/',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    interventionController.getAllInterventions
);

/**
 * @route   GET /api/v1/interventions/:id
 * @desc    Récupérer une intervention par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    interventionController.getInterventionById
);

/**
 * @route   PUT /api/v1/interventions/:id
 * @desc    Mettre à jour une intervention (admin/manager)
 * @access  Private (authentifié)
 */
router.put('/:id',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    interventionController.updateIntervention
);

/**
 * @route   PATCH /api/v1/interventions/:id/start
 * @desc    Démarrer une intervention
 * @access  Private (technician, admin)
 */
router.patch('/:id/start',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    interventionController.startIntervention
);

/**
 * @route   PATCH /api/v1/interventions/:id/complete
 * @desc    Marquer une intervention comme complétée
 * @access  Private (technician, admin)
 */
router.patch('/:id/complete',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    interventionController.completeIntervention
);

/**
 * @route   PATCH /api/v1/interventions/:id/advance
 * @desc    Avancer d'une étape dans le processus
 * @access  Private (technician, admin)
 */
router.patch('/:id/advance',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager'),
    interventionController.advanceInterventionStep
);

/**
 * @route   PATCH /api/v1/interventions/:id/quality-check
 * @desc    Effectuer un contrôle qualité
 * @access  Private (manager, admin)
 */
router.patch('/:id/quality-check',
    authenticate,
    authorize('manager', 'admin', 'super_admin'),
    interventionController.qualityCheck
);

module.exports = router;
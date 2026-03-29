/**
 * ROUTES EQUIPMENTS
 * /api/v1/equipments
 * Gestion complète du cycle de vie des équipements
 */

const express = require('express');
const router = express.Router();

const equipmentController = require('../controllers/equipmentController');
const { authenticate, authorize, validate } = require('../middlewares');
const { equipmentSchema, equipmentStatusSchema } = require('../utils/validators');

/**
 * @route   GET /api/v1/equipments/scan/:token
 * @desc    Récupérer un équipement par son token QR (public)
 * @access  Public
 */
router.get('/scan/:token', equipmentController.getEquipmentByToken);

/**
 * @route   GET /api/v1/equipments/stats/overview
 * @desc    Statistiques globales des équipements
 * @access  Private (manager, admin)
 * NOTE: Doit être AVANT /:id pour éviter que Express interprète "stats" comme un UUID
 */
router.get('/stats/overview',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    equipmentController.getEquipmentsStats
);

/**
 * @route   GET /api/v1/equipments/status/:status
 * @desc    Récupérer les équipements par statut
 * @access  Private (authentifié)
 * NOTE: Doit être AVANT /:id pour éviter que Express interprète "status" comme un UUID
 */
router.get('/status/:status',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    equipmentController.getEquipmentsByStatus
);

/**
 * @route   POST /api/v1/equipments
 * @desc    Déposer un nouvel équipement
 * @access  Private (receptionist, admin)
 */
router.post('/',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin'),
    validate(equipmentSchema),
    equipmentController.createEquipment
);

/**
 * @route   GET /api/v1/equipments
 * @desc    Récupérer tous les équipements avec filtres
 * @access  Private (authentifié)
 */
router.get('/',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    equipmentController.getAllEquipments
);

/**
 * @route   GET /api/v1/equipments/:id
 * @desc    Récupérer un équipement par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    authorize('technician', 'admin', 'super_admin', 'manager', 'receptionist'),
    equipmentController.getEquipmentById
);

/**
 * @route   PUT /api/v1/equipments/:id
 * @desc    Mettre à jour les infos d'un équipement
 * @access  Private (receptionist, admin)
 */
router.put('/:id',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin'),
    equipmentController.updateEquipment
);

/**
 * @route   PATCH /api/v1/equipments/:id/status
 * @desc    Changer le statut d'un équipement (workflow)
 * @access  Private (technician, manager, admin) — tout le staff
 */
router.patch('/:id/status',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin', 'technician', 'manager'),
    validate(equipmentStatusSchema),
    equipmentController.changeEquipmentStatus
);

/**
 * @route   PATCH /api/v1/equipments/:id/assign
 * @desc    Assigner un technicien à un équipement
 * @access  Private (manager, admin)
 */
router.patch('/:id/assign',
    authenticate,
    authorize('admin', 'super_admin', 'manager'),
    equipmentController.assignTechnician
);
/**
 * @route   PATCH /api/v1/equipments/:id/confirm-pickup
 * @desc    Agent confirme la récupération d'un équipement
 * @access  Private (receptionist, admin)
 */
router.patch('/:id/confirm-pickup',
    authenticate,
    authorize('receptionist', 'admin', 'super_admin', 'manager'),
    equipmentController.confirmPickup
);

module.exports = router;
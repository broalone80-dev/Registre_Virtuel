/**
 * ROUTES EQUIPMENT_TYPES
 * /api/v1/equipment-types
 */

const express = require('express');
const router = express.Router();

const equipmentTypeController = require('../controllers/equipmentTypeController');
const { authenticate, authorize } = require('../middlewares');

/**
 * @route   POST /api/v1/equipment-types
 * @desc    Créer un type d'équipement
 * @access  Private (admin, super_admin)
 */
router.post('/',
    authenticate,
    authorize('admin', 'super_admin'),
    equipmentTypeController.createEquipmentType
);

/**
 * @route   GET /api/v1/equipment-types
 * @desc    Récupérer tous les types
 * @access  Private (authentifié)
 */
router.get('/',
    authenticate,
    equipmentTypeController.getAllEquipmentTypes
);

/**
 * @route   GET /api/v1/equipment-types/:id
 * @desc    Récupérer un type par ID
 * @access  Private (authentifié)
 */
router.get('/:id',
    authenticate,
    equipmentTypeController.getEquipmentTypeById
);

/**
 * @route   PUT /api/v1/equipment-types/:id
 * @desc    Mettre à jour un type
 * @access  Private (admin, super_admin)
 */
router.put('/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    equipmentTypeController.updateEquipmentType
);

/**
 * @route   DELETE /api/v1/equipment-types/:id
 * @desc    Supprimer un type
 * @access  Private (admin, super_admin)
 */
router.delete('/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    equipmentTypeController.deleteEquipmentType
);

module.exports = router;
/**
 * INDEX DES ROUTES
 * Centralise toutes les routes de l'API
 */

const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./authRoutes');
const agencyRoutes = require('./agencyRoutes');
const userRoutes = require('./userRoutes');
const depositorRoutes = require('./depositorRoutes');
const equipmentTypeRoutes = require('./equipmentTypeRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const diagnosticRoutes = require('./diagnosticRoutes');
const interventionRoutes = require('./interventionRoutes');
const notificationRoutes = require('./notificationRoutes');
const aiRoutes = require('./aiRoutes');
const messageRoutes = require('./messageRoutes');

// Montage des routes
router.use('/auth', authRoutes);
router.use('/agencies', agencyRoutes);
router.use('/users', userRoutes);
router.use('/depositors', depositorRoutes);
router.use('/equipment-types', equipmentTypeRoutes);
router.use('/equipments', equipmentRoutes);
router.use('/diagnostics', diagnosticRoutes);
router.use('/interventions', interventionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/messages', messageRoutes);

// Route de test API
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Registre Virtuel EU - v1 - COMPLÈTE',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            agencies: '/api/v1/agencies',
            users: '/api/v1/users',
            depositors: '/api/v1/depositors',
            equipmentTypes: '/api/v1/equipment-types',
            equipments: '/api/v1/equipments',
            diagnostics: '/api/v1/diagnostics',
            interventions: '/api/v1/interventions'
        },
        status: '✅ API fully functional'
    });
});

module.exports = router;
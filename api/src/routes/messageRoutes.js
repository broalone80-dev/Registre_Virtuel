/**
 * ROUTES MESSAGES
 * Endpoints pour la messagerie interne (interventions + équipements)
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

// Messages d'une intervention
router.get('/intervention/:interventionId', authenticate, messageController.getInterventionMessages);

// Messages d'un équipement
router.get('/equipment/:equipmentId', authenticate, messageController.getEquipmentMessages);

// Envoyer un message (intervention ou équipement)
router.post('/', authenticate, messageController.sendMessage);

module.exports = router;

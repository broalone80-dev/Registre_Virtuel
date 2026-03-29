/**
 * MESSAGE CONTROLLER
 * Gère la création et la récupération des messages
 * Supporte messages liés à une intervention OU un équipement
 */

const { Message, User } = require('../models');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

/**
 * Envoie un nouveau message
 */
exports.sendMessage = async (req, res, next) => {
    try {
        const { content, intervention_id, equipment_id, message_type = 'text' } = req.body;
        const sender_id = req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Le contenu est requis' });
        }

        if (!intervention_id && !equipment_id) {
            return res.status(400).json({
                success: false,
                message: 'Un ID d\'intervention ou d\'équipement est requis'
            });
        }

        const message = await Message.create({
            content,
            intervention_id: intervention_id || null,
            equipment_id: equipment_id || null,
            sender_id,
            message_type
        });

        // Récupérer le message avec les infos de l'expéditeur
        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'role'] }]
        });

        // Envoyer via Socket.io — ciblé par room
        try {
            if (equipment_id) {
                socketService.toEquipment(equipment_id, `chat:${equipment_id}`, fullMessage);
            } else if (intervention_id) {
                socketService.toIntervention(intervention_id, `chat:${intervention_id}`, fullMessage);
            }
        } catch (sockErr) {
            // Fallback broadcast si rooms échouent
            try {
                const io = socketService.getIo();
                if (io) io.emit(`chat:${equipment_id || intervention_id}`, fullMessage);
            } catch (e) { /* ignore */ }
        }

        res.status(201).json({ success: true, data: fullMessage });
    } catch (error) {
        logger.error('Erreur lors de l\'envoi du message', { error: error.message });
        next(error);
    }
};

/**
 * Récupère l'historique des messages d'une intervention
 */
exports.getInterventionMessages = async (req, res, next) => {
    try {
        const { interventionId } = req.params;
        const messages = await Message.findAll({
            where: { intervention_id: interventionId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'role'] }],
            order: [['created_at', 'ASC']]
        });
        res.json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère l'historique des messages d'un équipement
 */
exports.getEquipmentMessages = async (req, res, next) => {
    try {
        const { equipmentId } = req.params;
        const messages = await Message.findAll({
            where: { equipment_id: equipmentId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name', 'role'] }],
            order: [['created_at', 'ASC']]
        });
        res.json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

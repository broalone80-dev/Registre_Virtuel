/**
 * CONTRÔLEUR NOTIFICATIONS
 * Gère les notifications internes (DB) et externes (Email)
 */

const { User, Notification } = require('../models');
const { sendNotificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Récupérer les notifications de l'utilisateur (interne)
 */
const getUserNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit
        });

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        logger.error('Erreur getUserNotifications:', error.message);
        next(error);
    }
};

/**
 * Marquer une notification comme lue
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { id, user_id: userId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }

        notification.is_read = true;
        await notification.save();

        res.json({
            success: true,
            message: 'Notification marquée comme lue'
        });
    } catch (error) {
        logger.error('Erreur markAsRead:', error.message);
        next(error);
    }
};

/**
 * Marquer toutes les notifications comme lues
 */
const markAllRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await Notification.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );

        res.json({
            success: true,
            message: 'Toutes les notifications ont été marquées comme lues'
        });
    } catch (error) {
        logger.error('Erreur markAllRead:', error.message);
        next(error);
    }
};

/**
 * Envoyer une notification email à un utilisateur (externe)
 */
const sendNotification = async (req, res) => {
    try {
        const { user_id, subject, message } = req.body;

        if (!user_id || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'user_id, subject et message sont requis'
            });
        }

        const targetUser = await User.findByPk(user_id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur destinataire non trouvé'
            });
        }

        const sent = await sendNotificationEmail(targetUser, subject, message, req.user);

        res.status(200).json({
            success: true,
            message: sent ? `Notification envoyée à ${targetUser.email}` : 'Service email non configuré',
            sent
        });

    } catch (error) {
        logger.error('Erreur envoi notification:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la notification',
            error: error.message
        });
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllRead,
    sendNotification
};

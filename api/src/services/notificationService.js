/**
 * Notification Service - Version Améliorée
 * ✅ PHASE 4: Granularité par rôle et agence
 */

const { Notification, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Créer une notification pour un utilisateur
 */
const createNotification = async (data) => {
    try {
        const { user_id, type, title, message, link } = data;

        const notification = await Notification.create({
            user_id,
            type,
            title,
            message,
            link
        });

        // Emit via Socket.io to the user
        try {
            const socketService = require('./socketService');
            if (socketService && socketService.getIo()) {
                socketService.toUser(user_id, 'new_notification', {
                    id: notification.id,
                    type,
                    title,
                    message,
                    link,
                    is_read: false,
                    created_at: notification.created_at || new Date().toISOString()
                });
            }
        } catch (sockErr) {
            logger.warn('Socket notification failed:', sockErr.message);
        }

        return notification;
    } catch (error) {
        logger.error('Error creating notification:', error.message);
        return null;
    }
};

/**
 * ✅ NOUVEAU (PHASE 4): Notifier les techniciens
 */
const notifyTechnicians = async (data, agencyFilter = null) => {
    try {
        const where = { role: 'technician', is_active: true };
        if (agencyFilter) where.agency_id = agencyFilter;

        const technicians = await User.findAll({
            where,
            attributes: ['id'],
            raw: true
        });

        const count = technicians.length;
        for (const user of technicians) {
            await createNotification({
                ...data,
                user_id: user.id
            });
        }
        logger.info(`✓ Notified ${count} technicians`);
        return count;
    } catch (error) {
        logger.error('Error notifying technicians:', error.message);
        return 0;
    }
};

/**
 * ✅ NOUVEAU (PHASE 4): Notifier les managers
 */
const notifyManagers = async (data, agencyFilter = null) => {
    try {
        const where = { role: 'manager', is_active: true };
        if (agencyFilter) where.agency_id = agencyFilter;

        const managers = await User.findAll({
            where,
            attributes: ['id'],
            raw: true
        });

        const count = managers.length;
        for (const user of managers) {
            await createNotification({
                ...data,
                user_id: user.id
            });
        }
        logger.info(`✓ Notified ${count} managers`);
        return count;
    } catch (error) {
        logger.error('Error notifying managers:', error.message);
        return 0;
    }
};

/**
 * ✅ NOUVEAU (PHASE 4): Notifier les admins
 */
const notifyAdmins = async (data) => {
    try {
        const admins = await User.findAll({
            where: {
                role: ['admin', 'super_admin'],
                is_active: true
            },
            attributes: ['id'],
            raw: true
        });

        const count = admins.length;
        for (const user of admins) {
            await createNotification({
                ...data,
                user_id: user.id
            });
        }
        logger.info(`✓ Notified ${count} admins`);
        return count;
    } catch (error) {
        logger.error('Error notifying admins:', error.message);
        return 0;
    }
};

/**
 * ✅ NOUVEAU (PHASE 4): Notifier les réceptionnistes
 */
const notifyReceptionists = async (data, agencyFilter = null) => {
    try {
        const where = { role: 'receptionist', is_active: true };
        if (agencyFilter) where.agency_id = agencyFilter;

        const receptionists = await User.findAll({
            where,
            attributes: ['id'],
            raw: true
        });

        const count = receptionists.length;
        for (const user of receptionists) {
            await createNotification({
                ...data,
                user_id: user.id
            });
        }
        logger.info(`✓ Notified ${count} receptionists`);
        return count;
    } catch (error) {
        logger.error('Error notifying receptionists:', error.message);
        return 0;
    }
};

/**
 * ✅ AMÉLIORÉ (PHASE 4): notifyStaff() - Plus complet
 * Notifie tous les rôles d'exploitation
 */
const notifyStaff = async (data, agencyFilter = null) => {
    try {
        const roles = ['admin', 'super_admin', 'technician', 'manager'];
        const where = { role: roles, is_active: true };
        if (agencyFilter) where.agency_id = agencyFilter;

        const staff = await User.findAll({
            where,
            attributes: ['id'],
            raw: true
        });

        for (const user of staff) {
            await createNotification({
                ...data,
                user_id: user.id
            });
        }
        logger.info(`✓ Notified ${staff.length} staff members`);
        return staff.length;
    } catch (error) {
        logger.error('Error notifying staff:', error.message);
        return 0;
    }
};

module.exports = {
    createNotification,
    notifyTechnicians,
    notifyManagers,
    notifyAdmins,
    notifyReceptionists,
    notifyStaff
};

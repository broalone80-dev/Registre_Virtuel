/**
 * Socket Service - Version Améliorée
 * ✅ PHASE 3: Ajoute room-based targeting au lieu de broadcasts globaux
 * Rooms: user_, role_, agency_, equipment_, intervention_
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../utils/logger');

let io;

exports.init = (server, corsOptions) => {
    io = socketIo(server, { cors: corsOptions });

    // JWT Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                logger.warn(`Socket Auth: Tentative de connexion sans token de ${socket.id}`);
                return next(new Error('Token missing'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findByPk(decoded.userId);

            if (!user || !user.is_active) {
                logger.warn(`Socket Auth: Utilisateur non trouvé ou inactif pour ID ${decoded.userId}`);
                return next(new Error('User invalid'));
            }

            socket.user = user;
            next();
        } catch (err) {
            logger.error(`Socket Auth Error: ${err.message}`);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        const userRole = socket.user?.role;
        const agencyId = socket.user?.agency_id;

        logger.info(`Socket connected: ${socket.id} (User: ${userId}, Role: ${userRole}, Agency: ${agencyId})`);

        // ✅ Join personal room
        if (userId) {
            socket.join(`user_${userId}`);
            logger.debug(`→ Joined user_${userId}`);
        }

        // ✅ Join role-based room
        if (userRole) {
            socket.join(`role_${userRole}`);
            logger.debug(`→ Joined role_${userRole}`);
        }

        // ✅ Join agency room
        if (agencyId) {
            socket.join(`agency_${agencyId}`);
            logger.debug(`→ Joined agency_${agencyId}`);
        }

        // ✅ Dynamic room joining
        socket.on('join_equipment', (equipmentId) => {
            socket.join(`equipment_${equipmentId}`);
            logger.debug(`→ Joined equipment_${equipmentId}`);
        });

        socket.on('leave_equipment', (equipmentId) => {
            socket.leave(`equipment_${equipmentId}`);
            logger.debug(`← Left equipment_${equipmentId}`);
        });

        socket.on('join_intervention', (interventionId) => {
            socket.join(`intervention_${interventionId}`);
            logger.debug(`→ Joined intervention_${interventionId}`);
        });

        socket.on('leave_intervention', (interventionId) => {
            socket.leave(`intervention_${interventionId}`);
            logger.debug(`← Left intervention_${interventionId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

exports.getIo = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

/**
 * ✅ NOUVEAU: Send to specific user only (PHASE 3)
 * @param {number} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
        logger.debug(`Socket: user_${userId} ← ${event}`);
    }
};

/**
 * ✅ NUOVO: Send to all users of a specific role (PHASE 3)
 * @param {string} role - User role
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toRole = (role, event, data) => {
    if (io) {
        io.to(`role_${role}`).emit(event, data);
        logger.debug(`Socket: role_${role} ← ${event}`);
    }
};

/**
 * ✅ NUOVO: Send to multiple roles (PHASE 3)
 * @param {array} roles - Array of roles
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toRoles = (roles, event, data) => {
    if (io && Array.isArray(roles)) {
        roles.forEach(role => {
            io.to(`role_${role}`).emit(event, data);
        });
        logger.debug(`Socket: roles [${roles.join(',')}] ← ${event}`);
    }
};

/**
 * ✅ NUOVO: Send to all users in an agency (PHASE 3)
 * @param {number} agencyId - Agency ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toAgency = (agencyId, event, data) => {
    if (io) {
        io.to(`agency_${agencyId}`).emit(event, data);
        logger.debug(`Socket: agency_${agencyId} ← ${event}`);
    }
};

/**
 * ✅ NUOVO: Send to equipment viewers (PHASE 3)
 * @param {number} equipmentId - Equipment ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toEquipment = (equipmentId, event, data) => {
    if (io) {
        io.to(`equipment_${equipmentId}`).emit(event, data);
        logger.debug(`Socket: equipment_${equipmentId} ← ${event}`);
    }
};

/**
 * Send to intervention participants
 * @param {number} interventionId - Intervention ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.toIntervention = (interventionId, event, data) => {
    if (io) {
        io.to(`intervention_${interventionId}`).emit(event, data);
        logger.debug(`Socket: intervention_${interventionId} ← ${event}`);
    }
};

/**
 * Send message (legacy)
 */
exports.sendMessage = (interventionId, event, data) => {
    if (io) {
        io.to(`intervention_${interventionId}`).emit(event, data);
    }
};

/**
 * ⚠️ Broadcast to EVERYONE (use sparingly!) - PHASE 3
 * @deprecated Use toRole/toRoles/toAgency/toEquipment instead
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
exports.broadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
        logger.warn(`Socket: BROADCAST TO ALL ← ${event}) - Consider using targeted room instead!`);
    }
};

module.exports = exports;

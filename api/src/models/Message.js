/**
 * MODÈLE MESSAGE
 * Gère les échanges de messagerie liés à une intervention/ticket
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    message_type: {
        type: DataTypes.ENUM('text', 'image', 'system'),
        defaultValue: 'text'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    equipment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'equipments',
            key: 'id'
        },
        comment: 'FK vers Equipment — discussion liée à un équipement'
    },
    intervention_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'interventions',
            key: 'id'
        }
    }
}, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Message;

/**
 * MODÈLE DIAGNOSTIC
 * Gère les diagnostics effectués sur les équipements
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Diagnostic = sequelize.define('Diagnostic', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fault_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Type de panne identifiée'
    },
    fault_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tests_performed: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Liste des tests effectués [{test, result}]'
    },
    result: {
        type: DataTypes.ENUM('repairable', 'unrepairable', 'needs_parts', 'pending', 'to_replace', 'to_exchange'),
        defaultValue: 'pending',
        allowNull: false
    },
    estimated_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    estimated_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    required_parts: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Pièces nécessaires [{part_id, quantity}]'
    },
    customer_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        comment: 'Le client a-t-il validé le devis ?'
    },
    customer_approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'diagnostics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Diagnostic;

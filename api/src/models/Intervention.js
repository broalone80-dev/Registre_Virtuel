/**
 * MODÈLE INTERVENTION
 * Gère les interventions/réparations sur les équipements
 * ✅ PHASE 6: diagnostic_id est REQUIS (allowNull: false)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Intervention = sequelize.define('Intervention', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    equipment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'FK vers Equipment - REQUIS'
    },
    diagnostic_id: {
        type: DataTypes.UUID,
        allowNull: true,  // Optionnel — permet les interventions d'urgence sans diagnostic
        comment: 'FK vers Diagnostic - optionnel'
    },
    technician_id: {
        type: DataTypes.UUID,
        allowNull: false,  // ✅ PHASE 6: Requis (NOUVEAU!)
        comment: 'FK vers User (technician) - REQUIS'
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paused_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    total_duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    actions_performed: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    parts_used: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Pièces utilisées [{part_id, quantity, cost}]'
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    maintenance_step: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Étape de maintenance (0-5)'
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'paused', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false
    },
    result_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quality_check_passed: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    quality_check_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quality_checked_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'FK vers User (manager/admin) qui a validé la qualité'
    },
    client_signature: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Signature client en base64'
    },
    satisfaction_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    }
}, {
    tableName: 'interventions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Intervention;

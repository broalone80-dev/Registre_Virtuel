/**
 * MODÈLE INTERVENTION_LOG
 * Gère la timeline détaillée (historique) des interventions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InterventionLog = sequelize.define('InterventionLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    action_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Ex: status_change, note_added, part_ordered, assigned'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    previous_value: {
        type: DataTypes.STRING,
        allowNull: true
    },
    new_value: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'intervention_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // On ne met jamais à jour un log
});

module.exports = InterventionLog;

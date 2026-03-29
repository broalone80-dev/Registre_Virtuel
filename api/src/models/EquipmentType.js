/**
 * MODÈLE EQUIPMENT_TYPE
 * Gère les types d'équipements (PC, Imprimante, Serveur, etc.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EquipmentType = sequelize.define('EquipmentType', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'informatique, telecom, bureautique, etc.'
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    diagnostic_checklist: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Liste des vérifications par défaut'
    },
    avg_repair_time_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'equipment_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = EquipmentType;

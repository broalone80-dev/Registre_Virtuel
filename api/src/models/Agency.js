/**
 * MODÈLE AGENCY
 * Gère les agences Express Union
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Agency = sequelize.define('Agency', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    region: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: { msg: 'Email invalide' }
        }
    },
    opening_hours: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Horaires d\'ouverture au format JSON'
    },
    max_daily_appointments: {
        type: DataTypes.INTEGER,
        defaultValue: 20
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'agencies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Agency;

/**
 * MODÈLE DEPOSITOR
 * Gère les dépositaires (clients qui déposent des équipements)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Depositor = sequelize.define('Depositor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: { msg: 'Email invalide' }
        }
    },
    id_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Type de pièce d\'identité (CNI, Passport, etc.)'
    },
    id_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    company_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    company_role: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    is_vip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    total_deposits: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'depositors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Méthode pour obtenir le nom complet
Depositor.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

module.exports = Depositor;

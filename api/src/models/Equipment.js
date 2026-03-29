/**
 * MODÈLE EQUIPMENT
 * Gère les équipements déposés pour réparation
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    reference: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Référence unique (ex: REF-2024-000001)'
    },
    qr_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    type_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'equipment_types',
            key: 'id'
        }
    },
    agency_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'agencies',
            key: 'id'
        }
    },
    depositor_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'depositors',
            key: 'id'
        }
    },
    received_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    assigned_technician_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    brand: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            'available',          // Actif dans le parc (disponible)
            'received',           // Reçu (indisponible)
            'waiting_diagnostic', // En attente diagnostic
            'in_diagnostic',      // Diagnostic en cours
            'waiting_approval',   // En attente validation devis
            'waiting_parts',      // En attente pièces
            'in_repair',          // Réparation en cours
            'quality_check',      // Contrôle qualité
            'repaired',           // Réparé
            'unrepairable',       // Irréparable
            'waiting_pickup',     // En attente retrait
            'delivered',          // Livré
            'archived',           // Archivé
            'replaced',           // Remplacé par un autre
            'exchanged',          // Échangé entre agences
            'transferred',        // Transféré vers une autre agence
            'in_transit'          // En transit entre sites
        ),
        defaultValue: 'received',
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal'
    },
    problem_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    accessories: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Liste des accessoires (chargeur, sacoche, etc.)'
    },
    photos: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'URLs des photos'
    },
    received_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    estimated_completion: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sla_deadline: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sla_breached: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    qr_token: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: true
    }
}, {
    tableName: 'equipments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Equipment;
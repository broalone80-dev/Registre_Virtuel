/**
 * INDEX DES MODÈLES
 * Centralise tous les modèles et définit les associations
 */

const { sequelize } = require('../config/database');

// Import des modèles
const User = require('./User');
const Agency = require('./Agency');
const Depositor = require('./Depositor');
const EquipmentType = require('./EquipmentType');
const Equipment = require('./Equipment');
const Diagnostic = require('./Diagnostic');
const Intervention = require('./Intervention');
const Message = require('./Message');
const Notification = require('./Notification');
const InterventionLog = require('./InterventionLog');

// ============================================
// ASSOCIATIONS
// ============================================

// User <-> Notification (Un utilisateur a plusieurs notifications)
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// User <-> Agency (Un utilisateur appartient à une agence)
User.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });
Agency.hasMany(User, { foreignKey: 'agency_id', as: 'users' });

// Agency <-> Manager (Une agence a un manager)
Agency.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// Depositor <-> Agency (Un dépositaire est lié à une agence)
Depositor.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });
Agency.hasMany(Depositor, { foreignKey: 'agency_id', as: 'depositors' });

// Equipment <-> EquipmentType
Equipment.belongsTo(EquipmentType, { foreignKey: 'type_id', as: 'type' });
EquipmentType.hasMany(Equipment, { foreignKey: 'type_id', as: 'equipments' });

// Equipment <-> Agency
Equipment.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });
Agency.hasMany(Equipment, { foreignKey: 'agency_id', as: 'equipments' });

// Equipment <-> Depositor
Equipment.belongsTo(Depositor, { foreignKey: 'depositor_id', as: 'depositor' });
Depositor.hasMany(Equipment, { foreignKey: 'depositor_id', as: 'equipments' });

// Equipment <-> User (received_by)
Equipment.belongsTo(User, { foreignKey: 'received_by', as: 'receivedByUser' });

// Equipment <-> User (assigned_technician)
Equipment.belongsTo(User, { foreignKey: 'assigned_technician_id', as: 'assignedTechnician' });

// Diagnostic <-> Equipment
Diagnostic.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' });
Equipment.hasMany(Diagnostic, { foreignKey: 'equipment_id', as: 'diagnostics' });

// Diagnostic <-> User (technician)
Diagnostic.belongsTo(User, { foreignKey: 'technician_id', as: 'technician' });
User.hasMany(Diagnostic, { foreignKey: 'technician_id', as: 'diagnostics' });

// Intervention <-> Equipment
Intervention.belongsTo(Equipment, {
    foreignKey: 'equipment_id',
    as: 'equipment',
    allowNull: false,
    onDelete: 'CASCADE'  // ✅ PHASE 6: If equipment deleted, delete interventions
});
Equipment.hasMany(Intervention, { foreignKey: 'equipment_id', as: 'interventions' });

// Intervention <-> Diagnostic (optionnel — permet interventions d'urgence)
Intervention.belongsTo(Diagnostic, {
    foreignKey: 'diagnostic_id',
    as: 'diagnostic',
    allowNull: true,
    onDelete: 'SET NULL'
});
Diagnostic.hasMany(Intervention, { foreignKey: 'diagnostic_id', as: 'interventions' });

// Intervention <-> User (technician) (✅ PHASE 6: REQUIS)
Intervention.belongsTo(User, {
    foreignKey: 'technician_id',
    as: 'technician',
    allowNull: false,  // ✅ PHASE 6: technician_id est REQUIS
    onDelete: 'RESTRICT'  // ✅ PHASE 6: Empêcher suppression de technician si intervention existe
});
User.hasMany(Intervention, { foreignKey: 'technician_id', as: 'interventions' });

// Intervention <-> User (quality_checked_by) (optional)
Intervention.belongsTo(User, {
    foreignKey: 'quality_checked_by',
    as: 'qualityChecker',
    allowNull: true
});

// Message Associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });

Message.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
Intervention.hasMany(Message, { foreignKey: 'intervention_id', as: 'messages' });

// Message <-> Equipment (FK existante dans le modèle Message)
Message.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' });
Equipment.hasMany(Message, { foreignKey: 'equipment_id', as: 'equipmentMessages' });

// InterventionLog Associations
InterventionLog.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
Intervention.hasMany(InterventionLog, { foreignKey: 'intervention_id', as: 'logs' });

InterventionLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(InterventionLog, { foreignKey: 'user_id', as: 'intervention_logs' });

// ============================================
// EXPORTS
// ============================================

module.exports = {
    sequelize,
    User,
    Agency,
    Depositor,
    EquipmentType,
    Equipment,
    Diagnostic,
    Intervention,
    InterventionLog,
    Message,
    Notification
};
/**
 * Migration: Add 'available' and 'waiting_pickup' to equipment status ENUM
 */

module.exports = {
    up: async (queryInterface, DataTypes) => {
        const qi = queryInterface.sequelize;
        try {
            await qi.query(`ALTER TABLE equipments MODIFY COLUMN status ENUM(
                'available', 'received', 'waiting_diagnostic', 'in_diagnostic',
                'waiting_approval', 'waiting_parts', 'in_repair', 'quality_check',
                'repaired', 'unrepairable', 'waiting_pickup', 'delivered',
                'archived', 'replaced', 'exchanged', 'transferred', 'in_transit'
            ) NOT NULL DEFAULT 'received'`);
        } catch (e) {
            console.log('ENUM update skipped:', e.message);
        }
    },

    down: async (queryInterface, DataTypes) => {
        // No rollback needed
    }
};

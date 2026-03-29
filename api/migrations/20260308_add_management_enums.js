/**
 * Migration: Add new ENUM values to Equipment status and Diagnostic result
 * - Equipment.status: replaced, exchanged, transferred, in_transit
 * - Diagnostic.result: to_replace, to_exchange
 */

module.exports = {
    up: async (queryInterface, DataTypes) => {
        // MySQL: ALTER ENUM by modifying the column type
        await queryInterface.sequelize.query(`
            ALTER TABLE equipments 
            MODIFY COLUMN status ENUM(
                'received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval',
                'waiting_parts', 'in_repair', 'quality_check', 'repaired',
                'unrepairable', 'waiting_pickup', 'delivered', 'archived',
                'replaced', 'exchanged', 'transferred', 'in_transit'
            ) NOT NULL DEFAULT 'received'
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE diagnostics 
            MODIFY COLUMN result ENUM(
                'repairable', 'unrepairable', 'needs_parts', 'pending',
                'to_replace', 'to_exchange'
            ) NOT NULL DEFAULT 'pending'
        `);
    },

    down: async (queryInterface, DataTypes) => {
        await queryInterface.sequelize.query(`
            ALTER TABLE equipments 
            MODIFY COLUMN status ENUM(
                'received', 'waiting_diagnostic', 'in_diagnostic', 'waiting_approval',
                'waiting_parts', 'in_repair', 'quality_check', 'repaired',
                'unrepairable', 'waiting_pickup', 'delivered', 'archived'
            ) NOT NULL DEFAULT 'received'
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE diagnostics 
            MODIFY COLUMN result ENUM(
                'repairable', 'unrepairable', 'needs_parts', 'pending'
            ) NOT NULL DEFAULT 'pending'
        `);
    }
};

/**
 * Migration: Extend messages table for equipment-level chat
 * - Add equipment_id column
 * - Make intervention_id nullable
 */

module.exports = {
    up: async (queryInterface, DataTypes) => {
        const qi = queryInterface.sequelize;

        // Add equipment_id column if not exists
        try {
            await qi.query(`
                ALTER TABLE messages ADD COLUMN equipment_id CHAR(36) NULL
            `);
        } catch (e) {
            // Column already exists, skip
            if (!e.message.includes('Duplicate column')) throw e;
        }

        // Make intervention_id nullable — need to drop FK first
        try {
            // Find and drop FK constraint on intervention_id
            const [fks] = await qi.query(`
                SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_NAME = 'messages'
                AND TABLE_SCHEMA = DATABASE()
                AND COLUMN_NAME = 'intervention_id'
                AND REFERENCED_TABLE_NAME IS NOT NULL
            `);
            for (const fk of fks) {
                await qi.query(`ALTER TABLE messages DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            }
        } catch (e) {
            // No FK to drop, continue
        }

        try {
            await qi.query(`
                ALTER TABLE messages MODIFY COLUMN intervention_id CHAR(36) NULL
            `);
        } catch (e) {
            // Already nullable, skip
        }
    },

    down: async (queryInterface, DataTypes) => {
        const qi = queryInterface.sequelize;
        try { await qi.query(`ALTER TABLE messages DROP COLUMN equipment_id`); } catch (e) { }
        try { await qi.query(`ALTER TABLE messages MODIFY COLUMN intervention_id CHAR(36) NOT NULL`); } catch (e) { }
    }
};

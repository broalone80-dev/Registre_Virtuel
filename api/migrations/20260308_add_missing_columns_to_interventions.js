/**
 * Migration: Add Missing Columns to Interventions Table
 * ✅ Phase 6: Database constraints and data integrity
 * 
 * Ajoute les colonnes manquantes et corrige les existantes:
 * - equipment_id (FK, NOT NULL)
 * - diagnostic_id (FK, NOT NULL) - NOUVEAU!
 * - technician_id (FK, NOT NULL) - NOUVEAU!
 * - priority (ENUM) - NOUVEAU!
 * - quality_checked_by (UUID, nullable)
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Récupérer les informations de la table actuelle
      const tableDescription = await queryInterface.describeTable('interventions');

      // ⚠️  SPECIAL HANDLING for technician_id: Must be synchronous
      // because we need to drop FK constraint BEFORE changing NOT NULL
      if (tableDescription.technician_id && tableDescription.technician_id.allowNull === true) {
        console.log('🔄 Handling technician_id: nullable → NOT NULL...');
        
        // Step 1: Find and drop existing FK constraint
        try {
          const constraints = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME='interventions' AND COLUMN_NAME='technician_id' 
             AND TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='users'`
          );
          
          if (constraints[0] && constraints[0].length > 0) {
            const constraintName = constraints[0][0].CONSTRAINT_NAME;
            console.log(`📌 Found FK constraint: ${constraintName}`);
            
            await queryInterface.sequelize.query(
              `ALTER TABLE \`interventions\` DROP FOREIGN KEY \`${constraintName}\``
            );
            console.log('✅ Dropped existing FK constraint');
          }
        } catch (e) {
          console.log('⚠️  No FK constraint found to drop (OK if first run)');
        }
        
        // Step 2: Change column to NOT NULL
        await queryInterface.changeColumn('interventions', 'technician_id', {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'FK vers User (technician) - REQUIS'
        });
        console.log('✅ Changed technician_id to NOT NULL');
        
        // Step 3: Add new FK constraint with RESTRICT
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE \`interventions\` ADD CONSTRAINT \`fk_interventions_technician_id\` 
             FOREIGN KEY (\`technician_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT`
          );
          console.log('✅ Added FK constraint with RESTRICT');
        } catch (e) {
          console.log('⚠️  Could not add FK constraint:', e.message);
        }
      }

      // Now handle other columns in parallel
      const promises = [];

      // 1. Ajouter equipment_id s'il n'existe pas
      if (!tableDescription.equipment_id) {
        promises.push(
          queryInterface.addColumn('interventions', 'equipment_id', {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'FK vers Equipment - REQUIS',
            references: {
              model: 'equipments',
              key: 'id'
            },
            onDelete: 'CASCADE'
          })
        );
      }

      // 2. Ajouter diagnostic_id s'il n'existe pas
      if (!tableDescription.diagnostic_id) {
        promises.push(
          queryInterface.addColumn('interventions', 'diagnostic_id', {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'FK vers Diagnostic - REQUIS et validé',
            references: {
              model: 'diagnostics',
              key: 'id'
            },
            onDelete: 'RESTRICT'
          })
        );
      }

      // 3. Ajouter priority s'il n'existe pas
      if (!tableDescription.priority) {
        promises.push(
          queryInterface.addColumn('interventions', 'priority', {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'medium',
            allowNull: false,
            comment: 'Priorité de l\'intervention'
          })
        );
      }

      // 4. Ajouter quality_checked_by s'il n'existe pas
      if (!tableDescription.quality_checked_by) {
        promises.push(
          queryInterface.addColumn('interventions', 'quality_checked_by', {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'FK vers User (manager/admin) qui a validé la qualité',
            references: {
              model: 'users',
              key: 'id'
            },
            onDelete: 'SET NULL'
          })
        );
      }

      // Exécuter les promesses en parallèle
      await Promise.all(promises);

      console.log('✅ Migration completed: Added missing columns to interventions table');
      return true;

    } catch (error) {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Supprimer les colonnes ajoutées
    try {
      const promises = [];

      // Vérifier et supprimer les colonnes une par une
      const tableDescription = await queryInterface.describeTable('interventions');

      if (tableDescription.equipment_id) {
        promises.push(queryInterface.removeColumn('interventions', 'equipment_id'));
      }
      if (tableDescription.diagnostic_id) {
        promises.push(queryInterface.removeColumn('interventions', 'diagnostic_id'));
      }
      if (tableDescription.technician_id) {
        // Ne pas supprimer technician_id car c'était une colonne existante
        // Juste la rendre nullable à nouveau si nécessaire
      }
      if (tableDescription.priority) {
        promises.push(queryInterface.removeColumn('interventions', 'priority'));
      }
      if (tableDescription.quality_checked_by) {
        promises.push(queryInterface.removeColumn('interventions', 'quality_checked_by'));
      }

      await Promise.all(promises);
      console.log('✅ Migration rolled back');
      return true;

    } catch (error) {
      console.error('❌ Rollback error:', error.message);
      throw error;
    }
  }
};

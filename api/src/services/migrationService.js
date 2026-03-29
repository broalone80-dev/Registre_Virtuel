/**
 * Migration Runner Service
 * Gère l'exécution automatique des migrations au démarrage
 */

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class MigrationRunner {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.migrationsPath = path.resolve(__dirname, '../../migrations');
    }

    /**
     * Exécuter les migrations en attente
     */
    async runMigrations() {
        try {
            logger.info('🔄 Vérification des migrations...');

            // Créer la table SequelizeMeta si elle n'existe pas
            await this.ensureMetaTable();

            // Récupérer les migrations exécutées
            const executedMigrations = await this.getExecutedMigrations();
            logger.debug(`Migrations exécutées: ${executedMigrations.length}`);

            // Récupérer les fichiers de migration
            const migrationFiles = this.getMigrationFiles();
            logger.debug(`Fichiers de migration trouvés: ${migrationFiles.length}`);

            // Exécuter les migrations en attente
            let executedCount = 0;
            for (const file of migrationFiles) {
                const name = path.basename(file);
                if (!executedMigrations.includes(name)) {
                    try {
                        await this.executeMigration(file, name);
                        executedCount++;
                    } catch (error) {
                        logger.error(`❌ Erreur lors de l'exécution de la migration ${name}:`, error.message);
                        throw error;
                    }
                }
            }

            if (executedCount > 0) {
                logger.info(`✅ ${executedCount} migration(s) exécutée(s) avec succès`);
            } else {
                logger.info('✅ Base de données à jour - aucune migration en attente');
            }

            return true;
        } catch (error) {
            logger.error('❌ Erreur lors de l\'exécution des migrations:', error.message);
            throw error;
        }
    }

    /**
     * Assurer que la table SequelizeMeta existe
     */
    async ensureMetaTable() {
        try {
            await this.sequelize.query(`
                CREATE TABLE IF NOT EXISTS SequelizeMeta (
                    name VARCHAR(255) PRIMARY KEY COMMENT 'Migration name'
                )
            `);
        } catch (error) {
            logger.warn('Impossible de créer la table SequelizeMeta:', error.message);
        }
    }

    /**
     * Récupérer la liste des migrations exécutées
     */
    async getExecutedMigrations() {
        try {
            const result = await this.sequelize.query(
                'SELECT name FROM SequelizeMeta ORDER BY name',
                { type: this.sequelize.QueryTypes.SELECT }
            );
            return result.map(r => r.name);
        } catch (error) {
            return [];
        }
    }

    /**
     * Récupérer la liste des fichiers de migration
     */
    getMigrationFiles() {
        try {
            if (!fs.existsSync(this.migrationsPath)) {
                return [];
            }

            return fs.readdirSync(this.migrationsPath)
                .filter(file => file.endsWith('.js'))
                .map(file => path.join(this.migrationsPath, file))
                .sort();
        } catch (error) {
            logger.warn('Erreur lors de la lecture des migrations:', error.message);
            return [];
        }
    }

    /**
     * Exécuter une migration
     */
    async executeMigration(filePath, name) {
        logger.info(`📦 Exécution de la migration: ${name}`);

        try {
            // Importer la migration
            // eslint-disable-next-line global-require, import/no-dynamic-require
            const migration = require(filePath);

            // Exécuter la migration
            if (migration.up) {
                await migration.up(
                    this.sequelize.getQueryInterface(),
                    this.sequelize.constructor.DataTypes
                );
            }

            // Enregistrer la migration comme exécutée
            await this.sequelize.query(
                `INSERT INTO SequelizeMeta (name) VALUES ('${name}')`
            );

            logger.info(`✅ Migration exécutée: ${name}`);
        } catch (error) {
            logger.error(`❌ Erreur lors de l'exécution de ${name}:`, error.message);
            throw error;
        }
    }
}

module.exports = MigrationRunner;

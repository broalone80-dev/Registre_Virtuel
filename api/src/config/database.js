/**
 * CONFIGURATION SEQUELIZE - CONNEXION MySQL
 * Gère la connexion à la base de données
 */

const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

// Création de l'instance Sequelize
const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: 'mysql',
        logging: config.app.env === 'development' ? (msg) => logger.debug(msg) : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true, // snake_case pour les colonnes
            freezeTableName: true
        }
    }
);

// Fonction pour tester la connexion
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Connexion à la base de données établie avec succès');
        return true;
    } catch (error) {
        logger.error('❌ Impossible de se connecter à la base de données:', error.message);
        return false;
    }
};

// Fonction pour synchroniser les modèles
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        logger.info('✅ Base de données synchronisée');
        return true;
    } catch (error) {
        logger.error('❌ Erreur de synchronisation:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};

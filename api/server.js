/**
 * SERVEUR PRINCIPAL
 * Point d'entrée de l'application
 */

require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { testConnection, syncDatabase } = require('./src/config/database');
const MigrationRunner = require('./src/services/migrationService');
const models = require('./src/models');

// Fonction principale de démarrage
const startServer = async () => {
    try {
        // 1. Test de connexion à la base de données
        logger.info('🔌 Connexion à la base de données...');
        const isConnected = await testConnection();

        if (!isConnected) {
            throw new Error('Impossible de se connecter à la base de données');
        }

        // 2. Synchronisation des modèles (création des tables)
        logger.info('📦 Synchronisation des modèles...');
        const { sequelize } = models;
        
        // Synchroniser les tables de base (sans altérations)
        await syncDatabase();

        // 3. Exécuter les migrations en attente
        logger.info('🔄 Exécution des migrations...');
        const migrationRunner = new MigrationRunner(sequelize);
        await migrationRunner.runMigrations();

        // 4. Démarrage du serveur HTTP avec Socket.io
        const http = require('http');
        const socketService = require('./src/services/socketService');
        const server = http.createServer(app);

        // Initialisation de Socket.io
        socketService.init(server, {
            origin: config.cors.origin,
            methods: ['GET', 'POST']
        });

        const PORT = config.app.port;

        server.listen(PORT, () => {
            logger.info('='.repeat(50));
            logger.info('🚀 REGISTRE VIRTUEL EU - API + REALTIME');
            logger.info('='.repeat(50));
            logger.info(`📍 Environnement : ${config.app.env}`);
            logger.info(`🌐 URL           : http://localhost:${PORT}`);
            logger.info(`❤️  Health Check : http://localhost:${PORT}/health`);
            logger.info(`📚 API Docs      : http://localhost:${PORT}/api-docs`);
            logger.info('='.repeat(50));
        });

    } catch (error) {
        logger.error('❌ Erreur au démarrage du serveur:', error.message);
        process.exit(1);
    }
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('FULL UNCAUGHT ERROR:', error);
    logger.error('❌ Uncaught Exception:', error.stack || error.message || error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

// Arrêt propre du serveur
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM reçu, arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('👋 SIGINT reçu, arrêt du serveur...');
    process.exit(0);
});

// Démarrage
startServer();

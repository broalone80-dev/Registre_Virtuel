/**
 * CONFIGURATION GÉNÉRALE DE L'APPLICATION
 * Centralise toutes les variables d'environnement
 */

require('dotenv').config();

module.exports = {
    // Application
    app: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 5000,
        apiVersion: process.env.API_VERSION || 'v1'
    },

    // Base de données
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        name: process.env.DB_NAME || 'registre_virtuel',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || ''
    },

    // JWT
    jwt: {
        secret: (() => {
            if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
                throw new Error('FATAL: JWT_SECRET must be set in production environment');
            }
            return process.env.JWT_SECRET || 'dev_only_secret_not_for_production';
        })(),
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 min
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000
    },

    // Email (SMTP)
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@registre-virtuel.eu',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    },

    // IA / Gemini (optionnel — fonctionne en mode rule-based si absent)
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        maxDescriptionLength: parseInt(process.env.AI_MAX_DESC_LENGTH, 10) || 2000,
        enabled: process.env.AI_ENABLED !== 'false' // activé par défaut
    }
};
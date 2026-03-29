/**
 * CONFIGURATION EXPRESS
 * Configure l'application Express avec tous les middlewares et Swagger
 * Production-ready avec sécurité, logging et documentation
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');

const config = require('./config');
const logger = require('./utils/logger');

// Création de l'application Express
const app = express();

// Trust proxy pour les tunnels (Cloudflare, ngrok, etc.)
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================

// Helmet - Sécurité des headers HTTP
app.use(helmet());

// CORS - Cross-Origin Resource Sharing
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Protection contre les attaques par force brute
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard.'
    },
    skip: (req) => req.path === '/health' // Exclure health check du rate limit
});
app.use('/api/', limiter);

// ============================================
// MIDDLEWARES DE PARSING
// ============================================

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression des réponses
app.use(compression());

// ============================================
// LOGGING
// ============================================

// Morgan - Logging des requêtes HTTP
if (config.app.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
    }));
}

// ============================================
// ROUTES DE SANTÉ ET DOCUMENTATION
// ============================================

// Route de santé (health check)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Registre Virtuel EU opérationnelle',
        environment: config.app.env,
        timestamp: new Date().toISOString()
    });
});

// Route racine
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenue sur l\'API Registre Virtuel EU',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            auth: '/api/v1/auth',
            agencies: '/api/v1/agencies',
            users: '/api/v1/users',
            depositors: '/api/v1/depositors',
            equipments: '/api/v1/equipments',
            diagnostics: '/api/v1/diagnostics',
            interventions: '/api/v1/interventions'
        }
    });
});

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: false,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        filter: true,
        showRequestHeaders: true
    },
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .swagger-ui .info .title { 
            color: #2c3e50;
        }
    `,
    customSiteTitle: 'Registre Virtuel EU - API Documentation'
}));

// ============================================
// ROUTES API
// ============================================

const apiRoutes = require('./routes');
app.use('/api/v1', apiRoutes);

// ============================================
// GESTION DES ERREURS
// ============================================

// Route 404 - Non trouvée
app.use((req, res, next) => {
    if (!res.headersSent) {
        res.status(404).json({
            success: false,
            message: `Route ${req.method} ${req.originalUrl} non trouvée`,
            path: req.originalUrl,
            method: req.method
        });
    }
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    logger.error(`Erreur: ${err.message}`, { stack: err.stack });

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || err.status || 500;
    const message = config.app.env === 'production'
        ? 'Une erreur interne est survenue'
        : err.message;

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.app.env === 'development' && {
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        })
    });
});

module.exports = app;
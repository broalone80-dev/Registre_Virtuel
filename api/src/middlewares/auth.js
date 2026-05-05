/**
 * MIDDLEWARE D'AUTHENTIFICATION JWT
 * Vérifie et décode les tokens JWT
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Vérifie que l'utilisateur est authentifié
 */
const authenticate = async (req, res, next) => {
    try {
        // Récupérer le token du header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.debug('Auth: Header manquant ou format invalide');
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            });
        }

        const token = authHeader.split(' ')[1].trim();

        if (!token || token === 'null' || token === 'undefined') {
            logger.debug('Auth: Token vide ou invalide');
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }

        // Debug token length only (never log secret material)
        logger.debug(`Auth: Vérification token, len [${token.length}]`);

        // Vérifier le token
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (jwtErr) {
            logger.error(`Auth: Erreur vérification JWT - ${jwtErr.message}`);
            return res.status(401).json({
                success: false,
                message: jwtErr.name === 'TokenExpiredError' ? 'Token expiré' : 'Token invalide'
            });
        }

        // Récupérer l'utilisateur
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            logger.warn(`Auth: Utilisateur non trouvé pour ID ${decoded.userId}`);
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (!user.is_active) {
            logger.warn(`Auth: Compte désactivé pour ${user.email}`);
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Ajouter l'utilisateur à la requête
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        logger.error(`Erreur d'authentification critique: ${error.message}`);
        console.error('FULL AUTH ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'authentification'
        });
    }
};

/**
 * Vérifie que l'utilisateur a un rôle spécifique
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non authentifié'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé pour ce rôle'
            });
        }

        next();
    };
};

/**
 * Génère un token JWT
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

module.exports = {
    authenticate,
    authorize,
    generateToken
};

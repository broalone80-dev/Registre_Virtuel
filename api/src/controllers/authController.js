/**
 * CONTRÔLEUR AUTH
 * Gère l'inscription, la connexion, et la réinitialisation de mot de passe
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken } = require('../middlewares/auth');
const logger = require('../utils/logger');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../services/emailService');

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role, agency_id } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Créer l'utilisateur (rôle forcé à receptionist — seul un admin peut promouvoir)
        const user = await User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role: 'receptionist',
            agency_id: agency_id || null
        });

        // Générer le token
        const token = generateToken(user.id);

        // Envoyer l'email de bienvenue (non-bloquant)
        sendWelcomeEmail(user).catch(() => { });

        logger.info(`Nouvel utilisateur inscrit: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            data: {
                user: user.toSafeObject(),
                token
            }
        });

    } catch (error) {
        logger.error('Erreur inscription:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
};

/**
 * Connexion d'un utilisateur
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trouver l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si l'utilisateur est actif
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Vérifier le mot de passe
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Mettre à jour la date de dernière connexion
        await user.update({ last_login_at: new Date() });

        // Générer le token
        const token = generateToken(user.id);

        logger.info(`Connexion réussie: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: user.toSafeObject(),
                token
            }
        });

    } catch (error) {
        logger.error('Erreur connexion:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 * GET /api/v1/auth/me
 */
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user.toSafeObject()
        });
    } catch (error) {
        logger.error('Erreur getMe:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil'
        });
    }
};

/**
 * Demande de réinitialisation de mot de passe
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });

        // Toujours répondre succès, même si l'email n'existe pas (sécurité)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
            });
        }

        // Générer un token aléatoire
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Sauvegarder le token hashé + expiration (1 heure)
        await user.update({
            reset_token: resetTokenHash,
            reset_token_expires: new Date(Date.now() + 60 * 60 * 1000)
        });

        // Envoyer l'email avec le token non-hashé
        const emailSent = await sendResetPasswordEmail(user, resetToken);

        if (!emailSent) {
            logger.warn(`Email de reset non envoyé pour ${email} - vérifier config SMTP`);
        }

        logger.info(`Demande de reset mot de passe pour: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
        });

    } catch (error) {
        logger.error('Erreur forgot password:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de réinitialisation',
            error: error.message
        });
    }
};

/**
 * Réinitialiser le mot de passe avec un token
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hasher le token reçu pour le comparer
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Trouver l'utilisateur avec ce token et non expiré
        const user = await User.findOne({
            where: {
                reset_token: resetTokenHash,
                reset_token_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        // Mettre à jour le mot de passe et effacer le token
        await user.update({
            password,
            reset_token: null,
            reset_token_expires: null
        });

        logger.info(`Mot de passe réinitialisé pour: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error) {
        logger.error('Erreur reset password:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation du mot de passe',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword
};

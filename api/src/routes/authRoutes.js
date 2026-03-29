/**
 * ROUTES AUTH
 * /api/v1/auth
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate, validate } = require('../middlewares');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Demander la réinitialisation du mot de passe
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Réinitialiser le mot de passe avec un token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;

/**
 * SERVICE EMAIL
 * Envoi d'emails via Nodemailer (SMTP)
 * Templates HTML pour : bienvenue, reset password, notification
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

// ============================================
// CONFIGURATION TRANSPORTER
// ============================================

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify()
    .then(() => logger.info('✅ Service email connecté et prêt'))
    .catch((err) => logger.warn('⚠️ Service email non disponible:', err.message));

// ============================================
// TEMPLATES HTML
// ============================================

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: linear-gradient(145deg, #1e293b, #1a2332); border-radius: 16px; padding: 40px; border: 1px solid rgba(148, 163, 184, 0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #3b82f6; font-size: 24px; margin: 0; letter-spacing: -0.5px; }
        .logo p { color: #64748b; font-size: 13px; margin-top: 4px; }
        .content { color: #cbd5e1; font-size: 15px; line-height: 1.7; }
        .content h2 { color: #e2e8f0; font-size: 20px; margin-bottom: 16px; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 20px 0; }
        .btn:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); }
        .info-box { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 16px; margin: 16px 0; }
        .info-box .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-box .value { color: #60a5fa; font-size: 16px; font-weight: 600; font-family: 'Courier New', monospace; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.1); color: #475569; font-size: 12px; }
        .warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 12px 16px; color: #fbbf24; font-size: 13px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <h1>📋 Registre Virtuel</h1>
                <p>Express Union — Gestion de Matériel</p>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} Registre Virtuel EU • Ce message est automatique
            </div>
        </div>
    </div>
</body>
</html>
`;

// ============================================
// FONCTIONS D'ENVOI
// ============================================

/**
 * Envoyer un email de bienvenue après inscription
 */
const sendWelcomeEmail = async (user) => {
    try {
        const html = baseTemplate(`
            <h2>🎉 Bienvenue ${user.first_name} !</h2>
            <p>Votre compte a été créé avec succès sur le <strong>Registre Virtuel Express Union</strong>.</p>
            
            <div class="info-box">
                <div class="label">Votre email de connexion</div>
                <div class="value">${user.email}</div>
            </div>
            
            <div class="info-box">
                <div class="label">Votre rôle</div>
                <div class="value">${user.role === 'technician' ? 'Maintenancier' : user.role === 'receptionist' ? 'Agent' : user.role}</div>
            </div>
            
            <p>Vous pouvez dès maintenant vous connecter à la plateforme pour gérer les équipements, diagnostics et interventions.</p>
            
            <a href="${config.email.frontendUrl}/login" class="btn">Se connecter →</a>
            
            <div class="warning">
                ⚠️ Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
            </div>
        `);

        await transporter.sendMail({
            from: `"Registre Virtuel EU" <${config.email.from}>`,
            to: user.email,
            subject: '🎉 Bienvenue sur Registre Virtuel EU',
            html
        });

        logger.info(`Email de bienvenue envoyé à ${user.email}`);
        return true;
    } catch (error) {
        logger.error(`Erreur envoi email bienvenue à ${user.email}:`, error.message);
        return false;
    }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendResetPasswordEmail = async (user, resetToken) => {
    try {
        const resetUrl = `${config.email.frontendUrl}/reset-password?token=${resetToken}`;

        const html = baseTemplate(`
            <h2>🔐 Réinitialisation du mot de passe</h2>
            <p>Bonjour <strong>${user.first_name}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe →</a>
            </div>
            
            <div class="info-box">
                <div class="label">Ou copiez ce lien dans votre navigateur</div>
                <div class="value" style="font-size: 12px; word-break: break-all;">${resetUrl}</div>
            </div>
            
            <div class="warning">
                ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </div>
        `);

        await transporter.sendMail({
            from: `"Registre Virtuel EU" <${config.email.from}>`,
            to: user.email,
            subject: '🔐 Réinitialisation de votre mot de passe — Registre Virtuel',
            html
        });

        logger.info(`Email de reset envoyé à ${user.email}`);
        return true;
    } catch (error) {
        logger.error(`Erreur envoi email reset à ${user.email}:`, error.message);
        return false;
    }
};

/**
 * Envoyer une notification custom d'un admin à un utilisateur
 */
const sendNotificationEmail = async (toUser, subject, message, fromUser) => {
    try {
        const html = baseTemplate(`
            <h2>📬 Notification</h2>
            <p>Bonjour <strong>${toUser.first_name}</strong>,</p>
            <p>Vous avez reçu un message de la part de <strong>${fromUser.first_name} ${fromUser.last_name}</strong> (${fromUser.role}) :</p>
            
            <div class="info-box">
                <div class="label">Sujet</div>
                <div class="value" style="font-size: 14px; color: #e2e8f0;">${subject}</div>
            </div>
            
            <div style="background: rgba(30, 41, 59, 0.8); border-radius: 10px; padding: 20px; margin: 16px 0; border-left: 4px solid #3b82f6;">
                <p style="color: #e2e8f0; margin: 0; white-space: pre-line;">${message}</p>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px;">Connectez-vous à la plateforme pour répondre ou consulter plus de détails.</p>
            
            <a href="${config.email.frontendUrl}/login" class="btn">Accéder à la plateforme →</a>
        `);

        await transporter.sendMail({
            from: `"Registre Virtuel EU" <${config.email.from}>`,
            to: toUser.email,
            subject: `📬 ${subject} — Registre Virtuel`,
            html
        });

        logger.info(`Notification envoyée de ${fromUser.email} à ${toUser.email}`);
        return true;
    } catch (error) {
        logger.error(`Erreur envoi notification à ${toUser.email}:`, error.message);
        return false;
    }
};

module.exports = {
    sendWelcomeEmail,
    sendResetPasswordEmail,
    sendNotificationEmail
};

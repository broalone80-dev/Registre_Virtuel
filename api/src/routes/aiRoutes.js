/**
 * ROUTES IA
 * Endpoints pour le pré-diagnostic intelligent et l'analyse interactive Q&R
 * 
 * ARCHITECTURE :
 * - POST /pre-diagnostic → Pré-diagnostic structuré JSON (severity, recommendation, quick_fixes)
 * - POST /analyze        → Analyse interactive Q&R (étape par étape)
 * - POST /answer         → Traitement des réponses au Q&R
 * 
 * SÉCURITÉ :
 * - Toutes les routes sont authentifiées (JWT)
 * - Validation Joi stricte sur toutes les entrées
 * - Sanitisation anti-injection de prompt dans le service
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { aiPreDiagnosticSchema, aiAnalyzeSchema, aiAnswerSchema } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * @route   POST /api/v1/ai/pre-diagnostic
 * @desc    Pré-diagnostic structuré AVANT dépôt
 *          Retourne : { severity, recommendation, quick_fixes[], summary }
 * @access  Private (receptionist, technician, admin, manager)
 * 
 * @example Requête :
 * {
 *   "description": "Mon PC portable ne s'allume plus du tout depuis ce matin",
 *   "equipment_type": "laptop",
 *   "brand": "Dell",
 *   "model": "Latitude 5520"
 * }
 * 
 * @example Réponse :
 * {
 *   "success": true,
 *   "data": {
 *     "severity": "high",
 *     "recommendation": "deposit_required",
 *     "quick_fixes": [
 *       "Tester avec un autre chargeur/câble d'alimentation compatible",
 *       "Effectuer un Hard Reset : débrancher l'alimentation..."
 *     ],
 *     "summary": "Problème critique de type Expertise Électronique...",
 *     "estimated_category": "power",
 *     "confidence": 0.75,
 *     "source": "rule_based",
 *     "expertise": "Expertise Électronique & Alimentation",
 *     "timestamp": "2026-03-31T10:00:00.000Z"
 *   }
 * }
 */
router.post('/pre-diagnostic', authenticate, validate(aiPreDiagnosticSchema), async (req, res, next) => {
    try {
        const { description, equipment_type, brand, model, equipment_id } = req.body;

        const result = await aiService.preDiagnostic(description, {
            equipment_type,
            brand,
            model,
            equipment_id
        });

        // Émettre via Socket.io pour mise à jour temps réel (si un équipement est lié)
        if (equipment_id) {
            try {
                const socketService = require('../services/socketService');
                if (socketService?.getIo()) {
                    socketService.toEquipment(equipment_id, 'ai:pre_diagnostic', {
                        equipment_id,
                        result,
                        initiated_by: req.user.id
                    });
                }
            } catch (sockErr) {
                logger.warn('Socket AI notification failed:', sockErr.message);
            }
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/v1/ai/analyze
 * @desc    Analyse un signalement et retourne un diagnostic Q&R interactif
 * @access  Private
 */
router.post('/analyze', authenticate, validate(aiAnalyzeSchema), async (req, res, next) => {
    try {
        const { description, equipmentId } = req.body;

        const analysis = await aiService.analyzeProblem(description, { equipmentId });

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/v1/ai/answer
 * @desc    Traite la réponse à une question du diagnostic Q&R
 * @access  Private
 */
router.post('/answer', authenticate, validate(aiAnswerSchema), async (req, res, next) => {
    try {
        const { problemType, stepIndex, answer, previousAnswers } = req.body;

        const result = await aiService.processAnswer(problemType, stepIndex, answer, previousAnswers);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

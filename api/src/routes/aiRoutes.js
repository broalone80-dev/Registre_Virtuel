/**
 * ROUTES IA
 * Endpoints pour l'analyse intelligente des pannes (format Q&R)
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticate } = require('../middlewares/auth');

/**
 * @route   POST /api/v1/ai/analyze
 * @desc    Analyse un signalement et retourne un diagnostic Q&R
 * @access  Private
 */
router.post('/analyze', authenticate, async (req, res, next) => {
    try {
        const { description, equipmentId } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'La description du problème est requise'
            });
        }

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
router.post('/answer', authenticate, async (req, res, next) => {
    try {
        const { problemType, stepIndex, answer, previousAnswers } = req.body;

        if (problemType === undefined || stepIndex === undefined || !answer) {
            return res.status(400).json({
                success: false,
                message: 'problemType, stepIndex et answer sont requis'
            });
        }

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

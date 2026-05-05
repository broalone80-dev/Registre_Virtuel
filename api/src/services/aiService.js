/**
 * AI SERVICE — PRÉ-DIAGNOSTIC INTELLIGENT
 * 
 * Ce service fournit :
 * 1. Un pré-diagnostic structuré AVANT dépôt (severity, recommendation, quick_fixes)
 * 2. Un diagnostic interactif Q&R pour guider le réceptionniste
 * 3. Une intégration optionnelle avec Gemini API pour analyses avancées
 * 
 * CONTRAINTES MÉTIER :
 * - L'IA ne modifie JAMAIS les statuts directement
 * - L'IA propose une aide à la décision uniquement
 * - Toutes les entrées sont sanitisées avant traitement
 */

const logger = require('../utils/logger');
const config = require('../config');

// ============================================
// SÉCURITÉ : SANITISATION DES ENTRÉES
// ============================================

const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+a/i,
    /forget\s+(all\s+)?your\s+(previous\s+)?instructions/i,
    /system\s*:\s*/i,
    /\bact\s+as\b/i,
    /\brole\s*:\s*/i,
    /\bpretend\b.*\byou\s+are\b/i,
    /\bDAN\b/,
    /\bjailbreak\b/i,
    /```[\s\S]*?(system|assistant|user)\s*:/i,
    /<\/?script/i,
    /<\/?iframe/i
];

/**
 * Sanitise une description utilisateur contre les injections de prompt
 * @param {string} input - Texte brut de l'utilisateur
 * @returns {{ clean: string, flagged: boolean }} Texte nettoyé et flag d'injection
 */
const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        return { clean: '', flagged: false };
    }

    // Limiter la longueur (max 2000 caractères)
    let text = input.slice(0, 2000).trim();

    // Détecter les tentatives d'injection
    const flagged = PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(text));
    if (flagged) {
        logger.warn(`⚠ Tentative d'injection de prompt détectée: "${text.slice(0, 100)}..."`);
        // Supprimer les patterns dangereux mais garder le contenu utile
        for (const pattern of PROMPT_INJECTION_PATTERNS) {
            text = text.replace(pattern, '');
        }
    }

    // Nettoyer les caractères de contrôle et balises
    text = text
        .replace(/<[^>]*>/g, '')           // Supprimer les balises HTML
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Caractères de contrôle
        .trim();

    return { clean: text, flagged };
};

// ============================================
// PROMPT SYSTÈME POUR GEMINI (OPTIONNEL)
// ============================================

const EXPERT_SYSTEM_PROMPT = `Tu es un expert senior en maintenance informatique avec 30 ans d'expérience.
Tu analyses des descriptions de problèmes d'équipements informatiques pour produire un pré-diagnostic.

RÈGLES STRICTES :
- Tu ne dois JAMAIS modifier de statut, base de données ou système.
- Tu fournis UNIQUEMENT une aide à la décision.
- Tu réponds TOUJOURS en JSON valide avec exactement cette structure :
{
  "severity": "low" | "medium" | "high",
  "recommendation": "no_action" | "monitor" | "deposit_required",
  "quick_fixes": ["action 1", "action 2", ...],
  "summary": "résumé technique en 2-3 phrases",
  "estimated_category": "power|screen|performance|network|printer|software|hardware",
  "confidence": 0.0 à 1.0
}

CRITÈRES DE SÉVÉRITÉ :
- low : problème mineur, résolvable par l'utilisateur (ex: redémarrage, mise à jour)
- medium : problème potentiellement matériel mais non critique (ex: lenteur, bruit ventilateur)
- high : panne grave nécessitant intervention technique (ex: écran cassé, ne s'allume plus, fumée)

CRITÈRES DE RECOMMANDATION :
- no_action : quick fixes suffisants, pas besoin de dépôt
- monitor : essayer les quick fixes d'abord, surveiller l'évolution
- deposit_required : dépôt en atelier nécessaire

Tu ne dois répondre qu'en JSON, sans markdown, sans explication hors JSON.`;

// ============================================
// BASE DE CONNAISSANCES EXPERTE
// ============================================

const KNOWLEDGE_BASE = {
    power: {
        keys: ['allume', 'démarre', 'éteint', 'noir', 'charge', 'batterie', 'alimentation', 'courant', 'power', 'mort', 'tension', 'fusible', 'reset'],
        severity: 'high',
        recommendation: 'deposit_required',
        questions: [
            "L'appareil émet-il un son (ventilateur, bip) ou un voyant s'allume-t-il au branchement ?",
            "Avez-vous remarqué une odeur de brûlé ou un bruit de clic au moment de la panne ?",
            "Le connecteur de charge semble-t-il endommagé physiquement ou a-t-il du jeu ?",
            "Avez-vous tenté un 'Hard Reset' (appui long 30s sur Power sans batterie/alim) ?"
        ],
        quick_fixes: [
            "Tester avec un autre chargeur/câble d'alimentation compatible",
            "Effectuer un Hard Reset : débrancher l'alimentation, retirer la batterie si possible, maintenir le bouton Power 30 secondes",
            "Vérifier que la prise murale fonctionne avec un autre appareil",
            "Inspecter visuellement le port de charge pour débris ou oxydation"
        ],
        solutions: [
            "Diagnostic du circuit primaire d'alimentation (fusibles, MOSFETs).",
            "Vérification de la tension de sortie de l'adaptateur secteur sous charge.",
            "Test de la pile CMOS et du bouton d'allumage physique.",
            "Audit du contrôleur de charge (IC Charge) sur carte mère."
        ],
        expertise: "Expertise Électronique & Alimentation"
    },
    screen: {
        keys: ['écran', 'affiche', 'affichage', 'pixels', 'image', 'scintille', 'lignes', 'résolution', 'flou', 'dalle', 'vitre', 'casse', 'gpu', 'carte graphique'],
        severity: 'high',
        recommendation: 'deposit_required',
        questions: [
            "Voyez-vous des fissures internes ou des coulures 'encre' sous le verre ?",
            "Le rétroéclairage fonctionne-t-il (image visible très sombre avec une lampe externe) ?",
            "Le problème change-t-il si vous inclinez l'écran à différents angles ?",
            "L'affichage est-il correct via la sortie HDMI sur un écran externe ?"
        ],
        quick_fixes: [
            "Connecter un écran externe via HDMI/VGA pour isoler le problème (dalle vs GPU)",
            "Ajuster la luminosité et la résolution dans les paramètres d'affichage",
            "Mettre à jour le pilote graphique depuis le site du fabricant",
            "Vérifier si le câble vidéo (nappe interne) est bien inséré (si accès facile)"
        ],
        solutions: [
            "Vérification de l'intégrité de la nappe eDP/LVDS au niveau de la charnière.",
            "Test de la dalle LCD par remplacement modulaire.",
            "Diagnostic du chipset graphique (BGA) ou de la VRAM.",
            "Contrôle du circuit Backlight (inverter ou driver LED)."
        ],
        expertise: "Expertise Affichage & Vidéo"
    },
    performance: {
        keys: ['lent', 'rame', 'bloque', 'freeze', 'gèle', 'figé', 'ralentit', 'performance', 'mémoire', 'vitesse', 'disque', '100%', 'surcharge', 'chauffe'],
        severity: 'medium',
        recommendation: 'monitor',
        questions: [
            "Le système se fige-t-il totalement avec la souris immobile ?",
            "Entendez-vous un bruit de grattage ou de 'clic-clic' provenant du matériel ?",
            "La lenteur est-elle principalement au démarrage ou lors du lancement d'applications ?",
            "Avez-vous remarqué une chaleur excessive sous le châssis ?"
        ],
        quick_fixes: [
            "Redémarrer l'ordinateur pour libérer la mémoire",
            "Ouvrir le Gestionnaire des tâches (Ctrl+Shift+Échap) et fermer les processus gourmands",
            "Désactiver les programmes au démarrage inutiles (msconfig ou Paramètres > Applications)",
            "Lancer un scan antivirus complet",
            "Vider les fichiers temporaires (Win+R → %temp% → supprimer le contenu)"
        ],
        solutions: [
            "Audit SMART du support de stockage (HDD/SSD) pour secteurs défectueux.",
            "Contrôle de l'étranglement thermique (Thermal Throttling) et nettoyage du dissipateur.",
            "Test de la stabilité de la mémoire vive (MemTest86).",
            "Analyse des goulots d'étranglement logiciels (processus zombies, malwares)."
        ],
        expertise: "Expertise Système & Performance"
    },
    network: {
        keys: ['internet', 'wifi', 'réseau', 'connexion', 'débit', 'lien', 'ethernet', 'ip', 'signal', 'partage', 'vpn', 'proxy', 'dns'],
        severity: 'low',
        recommendation: 'no_action',
        questions: [
            "Le WiFi se déconnecte-t-il de manière intermittente ou pas du tout ?",
            "D'autres appareils fonctionnent-ils sur le même point d'accès ?",
            "Le problème persiste-t-il en branchant un câble Ethernet ?",
            "Avez-vous des erreurs de type 'DNS' ou 'IP non valide' ?"
        ],
        quick_fixes: [
            "Redémarrer le routeur/box internet (débrancher 30s puis rebrancher)",
            "Désactiver puis réactiver la carte WiFi (Paramètres > Réseau)",
            "Oublier le réseau WiFi puis s'y reconnecter",
            "Réinitialiser la pile réseau : ouvrir CMD en admin → netsh winsock reset → redémarrer",
            "Changer les DNS en 8.8.8.8 / 8.8.4.4 (Google) ou 1.1.1.1 (Cloudflare)"
        ],
        solutions: [
            "Réinitialisation profonde de la pile réseau (netsh winsock/int ip reset).",
            "Analyse de l'intégrité de la carte réseau mini-PCIe ou USB.",
            "Mise à jour ou rollback du pilote WLAN/Ethernet.",
            "Vérification des paramètres du pare-feu et des tables de routage."
        ],
        expertise: "Expertise Réseaux & Télécoms"
    },
    printer: {
        keys: ['imprime', 'impression', 'papier', 'bourrage', 'encre', 'toner', 'cartouche', 'imprimante', 'scanner', 'copie', 'tache', 'rouleau'],
        severity: 'medium',
        recommendation: 'monitor',
        questions: [
            "Le bourrage se produit-t-il toujours au même endroit (bac, four, sortie) ?",
            "L'imprimante affiche-t-elle un code d'erreur spécifique sur son écran ?",
            "Les impressions présentent-elles des traces répétitives ou des zones blanches ?",
            "L'appareil est-il détecté en ligne dans le panneau de configuration ?"
        ],
        quick_fixes: [
            "Éteindre l'imprimante, retirer délicatement le papier coincé, puis rallumer",
            "Vérifier le niveau d'encre/toner et remplacer si nécessaire",
            "Supprimer la file d'attente d'impression bloquée (Services > Spouleur d'impression > Redémarrer)",
            "Réinstaller le pilote d'imprimante depuis le site du fabricant"
        ],
        solutions: [
            "Nettoyage des patins d'entraînement avec une solution adaptée.",
            "Vérification de l'état du film de fixation du four (Fuser).",
            "Audit du firmware et test de communication bidirectionnelle.",
            "Contrôle des capteurs optiques de présence papier."
        ],
        expertise: "Expertise Impression & Imaging"
    },
    software: {
        keys: ['logiciel', 'windows', 'microsoft', 'office', 'outlook', 'erreur', 'code', 'crash', 'bleu', 'bsod', 'update', 'mise à jour', 'installation', 'désinstallation'],
        severity: 'low',
        recommendation: 'no_action',
        questions: [
            "Le crash survient-il après une mise à jour récente de Windows ?",
            "Quel est le code d'erreur exact affiché (ex: 0x000000...) ?",
            "Le logiciel fonctionne-t-il si vous le lancez en mode administrateur ?",
            "Avez-vous tenté une restauration système à une date antérieure ?"
        ],
        quick_fixes: [
            "Redémarrer l'ordinateur et relancer le logiciel",
            "Exécuter le programme en mode administrateur (clic droit > Exécuter en tant qu'administrateur)",
            "Lancer la réparation Windows : CMD admin → sfc /scannow → DISM /Online /Cleanup-Image /RestoreHealth",
            "Désinstaller la dernière mise à jour Windows si le problème est apparu après",
            "Restaurer le système à un point de sauvegarde antérieur"
        ],
        solutions: [
            "Réparation de l'image système (DISM / SFC).",
            "Réinstallation propre de l'application et nettoyage de la base de registre.",
            "Analyse des fichiers de vidage mémoire (Memory Dumps).",
            "Mise à jour des runtimes critiques (C++, .NET, DirectX)."
        ],
        expertise: "Expertise Software & OS"
    },
    generic: {
        keys: [],
        severity: 'medium',
        recommendation: 'monitor',
        questions: [
            "L'incident a-t-il été précédé d'un événement particulier (choc, foudre, mise à jour) ?",
            "Le problème est-il systématique ou aléatoire ?",
            "Une tierce personne a-t-elle tenté d'intervenir sur le matériel ?"
        ],
        quick_fixes: [
            "Redémarrer complètement l'appareil (arrêt complet puis rallumage)",
            "Vérifier les connexions physiques (câbles, périphériques)",
            "Noter précisément les circonstances et la fréquence du problème"
        ],
        solutions: [
            "Audit visuel interne pour détecter des composants suspects (condensateurs, traces d'eau).",
            "Analyse des logs système et application.",
            "Test modulaire hors châssis (si applicable)."
        ],
        expertise: "Expertise Maintenance de Premier Niveau"
    }
};

// ============================================
// ANALYSE SÉMANTIQUE (RULE-BASED)
// ============================================

/**
 * Analyse sémantique par mots-clés pondérés
 * @param {string} description - Description sanitisée
 * @returns {string} Catégorie identifiée
 */
const performExpertAnalysis = (description) => {
    const text = description.toLowerCase();
    let scores = [];

    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
        if (category === 'generic') continue;
        const matches = data.keys.filter(k => text.includes(k));
        if (matches.length > 0) {
            scores.push({ category, score: matches.length });
        }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.length > 0 ? scores[0].category : 'generic';
};

/**
 * Calcule la sévérité dynamiquement selon les mots-clés critiques
 * @param {string} description - Description sanitisée
 * @param {string} category - Catégorie identifiée
 * @returns {string} Niveau de sévérité (low, medium, high)
 */
const computeSeverity = (description, category) => {
    const text = description.toLowerCase();
    const baseSeverity = KNOWLEDGE_BASE[category]?.severity || 'medium';

    // Mots-clés aggravants → upgrade vers high
    const criticalKeywords = ['fumée', 'brûlé', 'explosé', 'cassé', 'fissure', 'flamme', 'eau', 'inondé', 'foudre', 'surtension', 'mort', 'détruit'];
    const hasCritical = criticalKeywords.some(k => text.includes(k));
    if (hasCritical) return 'high';

    // Mots-clés atténuants → downgrade vers low
    const mildKeywords = ['parfois', 'léger', 'un peu', 'occasionnel', 'rare', 'petit'];
    const hasMild = mildKeywords.some(k => text.includes(k));
    if (hasMild && baseSeverity === 'medium') return 'low';

    return baseSeverity;
};

/**
 * Détermine la recommandation selon sévérité et catégorie
 * @param {string} severity
 * @param {string} category
 * @returns {string} Recommandation (no_action, monitor, deposit_required)
 */
const computeRecommendation = (severity, category) => {
    if (severity === 'high') return 'deposit_required';
    if (severity === 'low') return 'no_action';
    return KNOWLEDGE_BASE[category]?.recommendation || 'monitor';
};

// ============================================
// INTÉGRATION GEMINI API (OPTIONNEL)
// ============================================

/**
 * Appelle l'API Gemini pour un pré-diagnostic avancé
 * Fallback automatique sur le système rule-based si indisponible
 * @param {string} description - Description sanitisée
 * @param {Object} context - Métadonnées (equipment_type, brand, model...)
 * @returns {Object|null} Réponse Gemini parsée ou null
 */
const callGeminiAPI = async (description, context = {}) => {
    const apiKey = config.ai?.geminiApiKey;
    if (!apiKey) return null;

    try {
        const contextPrompt = context.equipment_type
            ? `\nContexte: type=${context.equipment_type}, marque=${context.brand || 'N/A'}, modèle=${context.model || 'N/A'}`
            : '';

        const userPrompt = `Analyse ce problème d'équipement informatique et produis un pré-diagnostic JSON :\n\n"${description}"${contextPrompt}`;

        // Dynamic import to avoid crash if package not installed
        const { default: fetch } = await import('node-fetch').catch(() => ({ default: null }));
        
        // Use native fetch if available (Node 18+), otherwise node-fetch
        const fetchFn = globalThis.fetch || fetch;
        if (!fetchFn) {
            logger.warn('Pas de fetch disponible — fallback sur rule-based');
            return null;
        }

        const response = await fetchFn(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: userPrompt }]
                    }],
                    systemInstruction: {
                        parts: [{ text: EXPERT_SYSTEM_PROMPT }]
                    },
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json'
                    }
                }),
                signal: AbortSignal.timeout(10000) // Timeout 10s
            }
        );

        if (!response.ok) {
            logger.warn(`Gemini API HTTP ${response.status} — fallback rule-based`);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const parsed = JSON.parse(text);

        // Valider la structure de la réponse
        const validSeverities = ['low', 'medium', 'high'];
        const validRecommendations = ['no_action', 'monitor', 'deposit_required'];

        if (!validSeverities.includes(parsed.severity) ||
            !validRecommendations.includes(parsed.recommendation) ||
            !Array.isArray(parsed.quick_fixes) ||
            typeof parsed.summary !== 'string') {
            logger.warn('Gemini: réponse mal structurée — fallback rule-based');
            return null;
        }

        return {
            severity: parsed.severity,
            recommendation: parsed.recommendation,
            quick_fixes: parsed.quick_fixes.slice(0, 6), // Max 6 quick fixes
            summary: parsed.summary.slice(0, 500),         // Max 500 chars
            estimated_category: parsed.estimated_category || null,
            confidence: Math.min(Math.max(parsed.confidence || 0.8, 0), 1),
            source: 'gemini'
        };
    } catch (error) {
        logger.warn(`Gemini API error: ${error.message} — fallback rule-based`);
        return null;
    }
};

// ============================================
// ENDPOINTS PRINCIPAUX
// ============================================

/**
 * PRÉ-DIAGNOSTIC STRUCTURÉ (NOUVEAU)
 * Produit une réponse JSON strictement formatée
 * 
 * @param {string} problemDescription - Description du problème (brut utilisateur)
 * @param {Object} context - { equipment_type, brand, model, equipment_id }
 * @returns {Object} Réponse structurée { severity, recommendation, quick_fixes, summary, ... }
 */
exports.preDiagnostic = async (problemDescription, context = {}) => {
    try {
        // 1. SANITISER L'ENTRÉE
        const { clean, flagged } = sanitizeInput(problemDescription);
        if (!clean) {
            throw new Error('Description vide après sanitisation');
        }

        // 2. TENTER GEMINI EN PREMIER (si configuré)
        const geminiResult = await callGeminiAPI(clean, context);
        if (geminiResult) {
            logger.info(`✓ Pré-diagnostic Gemini OK (${geminiResult.severity}/${geminiResult.recommendation})`);
            return {
                ...geminiResult,
                flagged_injection: flagged,
                timestamp: new Date().toISOString()
            };
        }

        // 3. FALLBACK : SYSTÈME RULE-BASED
        const category = performExpertAnalysis(clean);
        const data = KNOWLEDGE_BASE[category];
        const severity = computeSeverity(clean, category);
        const recommendation = computeRecommendation(severity, category);

        const summaryMap = {
            no_action: `Problème de type "${data.expertise}" identifié. Les solutions rapides ci-dessous devraient résoudre le problème sans nécessiter de dépôt en atelier.`,
            monitor: `Problème de type "${data.expertise}" détecté. Nous recommandons d'essayer les solutions rapides d'abord et de surveiller l'évolution. Si le problème persiste, un dépôt sera nécessaire.`,
            deposit_required: `Problème critique de type "${data.expertise}" identifié. Le dépôt en atelier est fortement recommandé pour un diagnostic approfondi par un technicien qualifié.`
        };

        const result = {
            severity,
            recommendation,
            quick_fixes: data.quick_fixes || data.solutions.slice(0, 4),
            summary: summaryMap[recommendation],
            estimated_category: category,
            confidence: category === 'generic' ? 0.5 : 0.75,
            source: 'rule_based',
            expertise: data.expertise,
            flagged_injection: flagged,
            timestamp: new Date().toISOString()
        };

        logger.info(`✓ Pré-diagnostic rule-based: ${severity}/${recommendation} (${category})`);
        return result;
    } catch (error) {
        logger.error('Erreur aiService.preDiagnostic:', error.message);
        throw error;
    }
};

/**
 * ANALYSE INTERACTIVE Q&R (existant, amélioré)
 * Point d'entrée pour l'analyse par l'IA lors du dépôt
 */
exports.analyzeProblem = async (problemDescription, context = {}) => {
    try {
        const { clean, flagged } = sanitizeInput(problemDescription);
        if (!clean) {
            throw new Error('Description vide après sanitisation');
        }

        const category = performExpertAnalysis(clean);
        const data = KNOWLEDGE_BASE[category];

        const questionsForUI = data.questions.map(q => ({
            question: q,
            options: ["Oui", "Non", "Je ne sais pas"]
        }));

        const summary = `Bonjour, je suis votre Assistant Expert de Maintenance Senior. 
J'ai analysé votre description et mon diagnostic préliminaire s'oriente vers : "${data.expertise}". 
Pour affiner mon analyse, merci de répondre aux questions suivantes :`;

        return {
            problemType: category,
            maintenanceType: (category === 'performance' || category === 'software') ? 'préventive/optimisation' : 'corrective',
            steps: questionsForUI,
            firstLevelActions: data.solutions,
            quick_fixes: data.quick_fixes || [],
            summary: summary,
            expertLevel: "Senior Specialist",
            flagged_injection: flagged
        };
    } catch (error) {
        logger.error('Erreur aiService.analyzeProblem:', error.message);
        throw error;
    }
};

/**
 * TRAITEMENT DES RÉPONSES INTERACTIVES (existant, amélioré)
 */
exports.processAnswer = async (problemType, stepIndex, answer, previousAnswers = []) => {
    try {
        // Valider problemType contre la base de connaissances
        const validTypes = Object.keys(KNOWLEDGE_BASE);
        if (!validTypes.includes(problemType)) {
            throw new Error(`Type de problème invalide: ${problemType}`);
        }

        const data = KNOWLEDGE_BASE[problemType];
        const totalSteps = data.questions.length;
        const isComplete = stepIndex >= totalSteps - 1;

        const currentAnswers = [...previousAnswers, { step: stepIndex, answer }];
        const yesCount = currentAnswers.filter(a => a.answer === 'Oui').length;

        const result = {
            isComplete,
            currentStep: stepIndex,
            totalSteps: totalSteps,
            previousAnswers: currentAnswers
        };

        if (isComplete) {
            // Calculer sévérité finale basée sur les réponses
            const baseSeverity = data.severity || 'medium';
            let finalSeverity = baseSeverity;
            if (yesCount >= 3) finalSeverity = 'high';
            else if (yesCount === 0 && baseSeverity !== 'high') finalSeverity = 'low';

            const recommendation = computeRecommendation(finalSeverity, problemType);

            result.preDiagnostic = {
                severity: finalSeverity,
                recommendation,
                quick_fixes: data.quick_fixes || [],
                summary: `Diagnostic interactif terminé. ${yesCount} point(s) critique(s) confirmé(s) sur ${totalSteps}. ${
                    recommendation === 'deposit_required'
                        ? 'Dépôt en atelier recommandé.'
                        : recommendation === 'monitor'
                            ? 'Surveillance recommandée après application des solutions rapides.'
                            : 'Les solutions rapides devraient suffire.'
                }`,
                estimated_category: problemType,
                confidence: 0.7 + (yesCount * 0.05)
            };

            result.suggestedPriority = finalSeverity === 'high' ? 'high' : (finalSeverity === 'medium' ? 'normal' : 'low');
            result.recommendedActions = data.solutions;
            result.finalSummary = result.preDiagnostic.summary;
        } else {
            result.nextStepIndex = stepIndex + 1;
        }

        return result;
    } catch (error) {
        logger.error('Erreur aiService.processAnswer:', error.message);
        throw error;
    }
};

// Export pour tests
exports._internal = {
    sanitizeInput,
    performExpertAnalysis,
    computeSeverity,
    computeRecommendation,
    KNOWLEDGE_BASE
};

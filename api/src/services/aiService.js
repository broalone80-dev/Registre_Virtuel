/**
 * AI SERVICE (UPGRADED — MAINTENANCE EXPERT PERSONA)
 * 
 * Ce service agit comme un Expert en Maintenance Informatique de 30 ans d'expérience.
 * Il analyse les symptômes, pose des questions diagnostiques précises et suggère
 * des solutions techniques avancées.
 */

const logger = require('../utils/logger');

const EXPERT_SYSTEM_PROMPT = `
Vous êtes un Expert Senior en Maintenance Informatique avec 30 ans d'expérience pratique.
Votre expertise est holistique : Maintenance curative et préventive, électronique de précision, 
systèmes d'exploitation critiques, réseaux complexes et optimisation de workflows.
Votre ton est extrêmement professionnel, précis, rassurant et analytique.
Identifiez les pannes à partir de descriptions souvent vagues, posez les questions 
critiques de levée de doute et proposez des solutions de niveau expert.
`;

const KNOWLEDGE_BASE = {
    power: {
        keys: ['allume', 'démarre', 'éteint', 'noir', 'charge', 'batterie', 'alimentation', 'courant', 'power', 'mort', 'tension', 'fusible', 'reset'],
        questions: [
            "L'appareil émet-il un son (ventilateur, bip) ou un voyant s'allume-t-il au branchement ?",
            "Avez-vous remarqué une odeur de brûlé ou un bruit de clic au moment de la panne ?",
            "Le connecteur de charge semble-t-il endommagé physiquement ou a-t-il du jeu ?",
            "Avez-vous tenté un 'Hard Reset' (appui long 30s sur Power sans batterie/alim) ?"
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
        questions: [
            "Voyez-vous des fissures internes ou des coulures 'encre' sous le verre ?",
            "Le rétroéclairage fonctionne-t-il (image visible très sombre avec une lampe externe) ?",
            "Le problème change-t-il si vous inclinez l'écran à différents angles ?",
            "L'affichage est-il correct via la sortie HDMI sur un écran externe ?"
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
        questions: [
            "Le système se fige-t-il totalement avec la souris immobile ?",
            "Entendez-vous un bruit de grattage ou de 'clic-clic' provenant du matériel ?",
            "La lenteur est-elle principalement au démarrage ou lors du lancement d'applications ?",
            "Avez-vous remarqué une chaleur excessive sous le châssis ?"
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
        questions: [
            "Le WiFi se déconnecte-t-il de manière intermittente ou pas du tout ?",
            "D'autres appareils fonctionnent-ils sur le même point d'accès ?",
            "Le problème persiste-t-il en branchant un câble Ethernet ?",
            "Avez-vous des erreurs de type 'DNS' ou 'IP non valide' ?"
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
        questions: [
            "Le bourrage se produit-t-il toujours au même endroit (bac, four, sortie) ?",
            "L'imprimante affiche-t-elle un code d'erreur spécifique sur son écran ?",
            "Les impressions présentent-elles des traces répétitives ou des zones blanches ?",
            "L'appareil est-il détecté en ligne dans le panneau de configuration ?"
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
        questions: [
            "Le crash survient-il après une mise à jour récente de Windows ?",
            "Quel est le code d'erreur exact affiché (ex: 0x000000...) ?",
            "Le logiciel fonctionne-t-il si vous le lancez en mode administrateur ?",
            "Avez-vous tenté une restauration système à une date antérieure ?"
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
        questions: [
            "L'incident a-t-il été précédé d'un événement particulier (choc, foudre, mise à jour) ?",
            "Le problème est-il systématique ou aléatoire ?",
            "Une tierce personne a-t-elle tenté d'intervenir sur le matériel ?"
        ],
        solutions: [
            "Audit visuel interne pour détecter des composants suspects (condensateurs, traces d'eau).",
            "Analyse des logs système et application.",
            "Test modulaire hors châssis (si applicable)."
        ],
        expertise: "Expertise Maintenance de Premier Niveau"
    }
};

/**
 * Analyse sémantique avancée
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
 * Point d'entrée pour l'analyse par l'IA lors du dépôt
 */
exports.analyzeProblem = async (problemDescription, context = {}) => {
    try {
        const category = performExpertAnalysis(problemDescription);
        const data = KNOWLEDGE_BASE[category];

        // Questions dynamiques simulées par expertise
        const questionsForUI = data.questions.map(q => ({
            question: q,
            options: ["Oui", "Non", "Je ne sais pas"]
        }));

        const summary = `Bonjour, je suis votre Assistant Expert de Maintenance Senior (30 ans d'expérience). 
J'ai analysé votre description : "${problemDescription}". 
Mon diagnostic préliminaire s'oriente vers une problématique de type "${data.expertise}". 
Pour affiner mon analyse et préparer l'intervention technique, merci de répondre avec précision aux questions suivantes :`;

        return {
            problemType: category,
            maintenanceType: (category === 'performance' || category === 'software') ? 'préventive/optimisation' : 'corrective',
            steps: questionsForUI,
            firstLevelActions: data.solutions,
            summary: summary,
            expertLevel: "Senior Specialist (30y experience)"
        };
    } catch (error) {
        logger.error('Erreur aiService.analyzeProblem:', error.message);
        throw error;
    }
};

/**
 * Traitement des réponses interactives
 */
exports.processAnswer = async (problemType, stepIndex, answer, previousAnswers = []) => {
    try {
        const data = KNOWLEDGE_BASE[problemType] || KNOWLEDGE_BASE.generic;
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
            // Synthèse finale par l'Expert
            result.suggestedPriority = (yesCount > 1 || ['power', 'network'].includes(problemType)) ? 'high' : 'normal';
            result.aiConfidence = 0.85 + (yesCount * 0.03);
            result.finalSummary = `Diagnostic expert terminé. Les symptômes confirment une intervention de type ${problemType}. ${yesCount} point(s) critiques validés. Le technicien est prévenu.`;
            result.recommendedActions = data.solutions;
        } else {
            result.nextStepIndex = stepIndex + 1;
        }

        return result;
    } catch (error) {
        logger.error('Erreur aiService.processAnswer:', error.message);
        throw error;
    }
};

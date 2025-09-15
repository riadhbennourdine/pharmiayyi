import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, ChatMessage, PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
    // In a server environment, you might want to throw an error to prevent the app from starting
    // throw new Error("GEMINI_API_KEY is not configured."); 
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig: GenerationConfig = {
    temperature: 0.5,
    topK: 1,
    topP: 1,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

export const generateCaseStudyFromText = async (text: string, theme: string, system: string): Promise<CaseStudy> => {
    const prompt = `
      À partir du texte suivant, génère une mémofiche de cas de comptoir pour un étudiant en pharmacie.
      La mémofiche doit être pertinente pour le thème "${theme}" et le système/organe "${system}".
      La mémofiche doit être structurée, claire, et pédagogique.
      Identifie un scénario patient plausible à partir du texte.
      Le ton doit être professionnel et didactique.

      Inclus les sections suivantes, en t'assurant que les tableaux sont bien des tableaux de chaînes de caractères ou d'objets selon le type:
      - "title": Titre concis de la mémofiche.
      - "patientSituation": Scénario patient détaillé.
      - "pathologyOverview": Aperçu de la pathologie en 5-7 points clés (string[]).
      - "keyQuestions": Tableau de chaînes de caractères (string[]) de questions clés à poser au patient.
      - "redFlags": Tableau de chaînes de caractères (string[]) de signaux d'alerte.
      - "recommendations": Objet avec 4 sous-sections:
        - "mainTreatment": "Tableau de 10 chaînes de caractères (string[]) résumant le traitement principal en points clés. Chaque point doit être très détaillé et inclure : le nom du traitement en gras (ex: **Nom du traitement**), la posologie précise (ex: **Amoxicilline**: Posologie: 1g 2 à 3 fois par jour), la durée du traitement (ex: Durée: 7 jours), et des conseils de dispensation importants. Si le texte source ne fournit pas de détails précis, génère des exemples de posologies et de durées plausibles et couramment admises pour un cas d'étude pédagogique. Ne te contente pas de dire \"selon notice\".",
        - "associatedProducts": "Tableau de 10 chaînes de caractères (string[]) résumant les produits associés en points clés. Chaque point doit être très détaillé et inclure : le nom du produit en gras (ex: **Nom du produit**), la posologie précise, la durée d'utilisation, et des conseils pertinents. Ne te contente pas de dire \"selon notice\".",
        - "lifestyleAdvice": Tableau de chaînes de caractères (string[]) de conseils d'hygiène de vie.
        - "dietaryAdvice": Tableau de chaînes de caractères (string[]) de conseils alimentaires.
      - "keyPoints": Tableau de 3 à 4 points clés ultra-concis.
      - "references": Tableau de chaînes de caractères (string[]) de jusqu'à 10 références bibliographiques pertinentes.
      - "flashcards": Tableau de 10 flashcards (objets avec "question" et "answer").
      - "glossary": Tableau de 10 termes techniques (objets avec "term" et "definition").
      - "media": Tableau de 1 à 2 supports médias (objets avec "title", "type" ('video' ou 'infographic'), et "url" - utilise des URLs de placeholder si tu ne peux pas générer de vraies URLs).
      - "coverImageUrl": URL d'une image de couverture pertinente. Utilise une URL de placeholder de https://picsum.photos si tu ne peux pas générer de vraie URL (par exemple, https://picsum.photos/1200/600).
      - "youtubeUrl": URL d'une vidéo YouTube pertinente. Utilise une URL de placeholder si tu ne peux pas générer de vraie URL (par exemple, https://www.youtube.com/watch?v=dQw4w9WgXcQ).
      - "quiz": Tableau de 10 questions de quiz (objets QuizQuestion avec "question", "options", "correctAnswerIndex", "explanation", "type" ('single-choice' ou 'true-false')). Pour Vrai/Faux, correctAnswerIndex est 0 pour "Vrai" et 1 pour "Faux".

      Texte source:
      ---
      ${text}
      ---

      Génère la réponse au format JSON.
    `;

    console.log("Prompt sent to Gemini:", prompt); // Log la prompt

    const parts = [
        { text: prompt },
    ];

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        const jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText); // Log la réponse brute de Gemini
        const generatedCase: CaseStudy = JSON.parse(jsonText);

        // Transform glossary if it's an object
        if (generatedCase.glossary && typeof generatedCase.glossary === 'object' && !Array.isArray(generatedCase.glossary)) {
            generatedCase.glossary = Object.entries(generatedCase.glossary).map(([term, definition]) => ({
                term: term,
                definition: definition as string
            }));
        }

        // Ensure recommendation sub-sections are arrays and conform to expected types
        if (generatedCase.recommendations) {
            const assureArray = (field: any) => {
                if (typeof field === 'string') {
                    return [field];
                }
                return field || [];
            };

            generatedCase.recommendations.lifestyleAdvice = assureArray(generatedCase.recommendations.lifestyleAdvice);
            generatedCase.recommendations.dietaryAdvice = assureArray(generatedCase.recommendations.dietaryAdvice);

            generatedCase.recommendations.mainTreatment = assureArray(generatedCase.recommendations.mainTreatment);
            generatedCase.recommendations.associatedProducts = assureArray(generatedCase.recommendations.associatedProducts);
        }

        console.log("Parsed CaseStudy object (after transformation):", generatedCase);
        return generatedCase;
    } catch (error) {
        console.error("Error generating case study:", error); // Log l'erreur ici aussi
        throw new Error("Failed to generate case study from text.");
    }
};

export const generatePharmacologyMemoFiche = async (sourceText: string, theme: string, pathology: string): Promise<PharmacologyMemoFiche> => {
    const prompt = `À partir du texte source fourni ci-dessous, génère une mémofiche de pharmacologie sur le thème de "${theme}", en te concentrant sur la pathologie de "${pathology}".

La mémofiche doit être structurée, claire et pédagogique, et doit viser à vulgariser les informations pour des étudiants en pharmacie.

La réponse doit être au format JSON, en respectant la structure suivante :

-   "title": (string) Un titre concis et informatif pour la mémofiche.
-   "pathology": (string) La pathologie principale concernée par ces classes pharmacologiques.
-   "pathologyOverview": (string) Un bref aperçu de la pathologie en 3 à 5 points clés.
-   "introduction": (string) Une brève introduction expliquant l'importance de ces classes de médicaments dans le traitement de la pathologie.
-   "pharmacologicalClasses": (array of objects) Une liste des principales familles pharmacologiques. Chaque objet doit contenir :
    -   "className": (string) Le nom de la classe pharmacologique.
    -   "mechanismOfAction": (string) Une explication claire et détaillée du mécanisme d'action.
    -   "differentialAdvantages": (string) Les avantages de cette classe par rapport à d'autres.
    -   "roleOfDiet": (string) L'influence de l'alimentation sur le traitement.
    -   "drugs": (array of objects) Une liste d'exemples de médicaments de cette classe. Chaque objet doit contenir :
        -   "name": (string) Le nom du médicament (DCI).
        -   "dosages": (string) Les posologies précises et courantes. Ne pas dire "selon notice".
        -   "precautionsForUse": (string) Les principales précautions d'emploi, contre-indications et effets indésirables.
-   "summaryTable": (object) Un tableau récapitulatif. L'objet doit contenir :
    -   "headers": (array of strings) Les en-têtes du tableau.
    -   "rows": (array of arrays of strings) Les lignes du tableau.
-   "keyPoints": (array of strings) Une liste de 3 à 5 points clés à retenir.
-   "glossary": (array of objects) Une liste de 5 à 10 termes importants avec leur définition, chaque objet contenant "term" et "definition".
-   "media": (array of objects) Une liste de 1 à 2 suggestions de médias (vidéo, infographie), chaque objet contenant "type", "title", et "url" (utiliser des placeholders si nécessaire).
-   "quiz": (array of objects) Un quiz de 5 à 10 questions pour tester les connaissances, chaque objet respectant la structure "QuizQuestion" (avec "question", "options", "correctAnswerIndex", "explanation", "type").
-   "flashcards": (array of objects) Une liste de 5 à 10 flashcards pour l'auto-évaluation, chaque objet contenant "question" et "answer".

---
Texte source :
"${sourceText}"
---`;

    console.log("Prompt sent to Gemini for Pharmacology MemoFiche:", prompt);

    const parts = [
        { text: prompt },
    ];

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        const jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);
        const generatedMemoFiche: PharmacologyMemoFiche = JSON.parse(jsonText);

        return generatedMemoFiche;
    } catch (error) {
        console.error("Error generating pharmacology memo fiche:", error);
        throw new Error("Failed to generate pharmacology memo fiche from text.");
    }
};

export const generateExhaustiveMemoFiche = async (sourceText: string): Promise<ExhaustiveMemoFiche> => {
    const prompt = `À partir du texte source fourni, rédigez un document de synthèse complet et détaillé sur l'Hypertension Artérielle (HTA) et la prise en charge des patients hypertendus, en mettant l'accent sur le rôle crucial des pharmaciens d'officine et des préparateurs en pharmacie.

Le document doit être structuré de manière à fournir des informations cliniques claires, des conseils pratiques pour la délivrance des ordonnances, des opportunités de ventes additionnelles, et une valorisation du rôle professionnel de l'équipe officinale.

La réponse doit être exclusivement au format JSON et suivre rigoureusement la structure suivante :

- "title": "Titre principal (ex: HTA et Antihypertenseurs)",
- "targetAudience": "Public cible (ex: Pharmaciens et Préparateurs)",
- "objectives": [ "Objectif 1", "Objectif 2", "..." ],
- "introductionToPathology": {
    "title": "Introduction à l'Hypertension Artérielle (HTA)",
    "definitionAndDiagnosis": "Inclure la définition de l'HTA (PA ≥ 140/90 mm Hg en consultation, maintenue dans le temps), les objectifs de PA pour différentes populations (générale, diabétiques, > 80 ans).",
    "prevalenceAndImportance": "Mentionner que l'HTA est le premier facteur de risque cardiovasculaire mondial, sa nature souvent asymptomatique, et les statistiques sur le traitement et le contrôle.",
    "riskFactorsAndCauses": "Lister les facteurs modifiables (surpoids, alcool, tabac, sédentarité, alimentation, hyperlipidémie, diabète) et les causes spécifiques (grossesse, troubles neurologiques, apnée du sommeil). Différencier l'HTA primaire et secondaire.",
    "complications": "Décrire les risques liés à une HTA non traitée (AVC, insuffisance cardiaque, infarctus, etc.).",
    "treatmentGoals": "Rappeler l'objectif principal de diminution de la morbimortalité cardiovasculaire et les cibles de PA.",
    "lifestyleMeasures": "Détailler ces mesures essentielles (perte de poids, réduction du sel, modération de l'alcool, arrêt du tabac, activité physique, gestion du stress) et leur importance dans la prise en charge."
  },
- "drugClasses": {
    "title": "Les Antihypertenseurs : Classes et Détails",
    "generalPrinciples": "Indiquer que le traitement est généralement à vie, l'importance de la formation continue et des ouvrages de référence. Expliquer que le choix initial peut se faire entre différentes classes et que les associations sont envisagées en cas d'efficacité insuffisante (avec les associations à éviter comme IEC-ARA2 ou thiazidique-diurétique de l'anse).",
    "classes": [
      {
        "name": "Antagonistes des Récepteurs de l'Angiotensine II (ARA II)",
        "examples": "Noms génériques et commerciaux (avec des exemples).",
        "mechanismOfAction": "Mécanisme d'action.",
        "mainSideEffects": "Effets secondaires principaux.",
        "patientAdvice": "Conseils pour le patient (si spécifiques à la classe, comme la prise des diurétiques ou les précautions d'hypotension orthostatique).",
        "contraindications": "Contre-indications (y compris la grossesse et l'allaitement si applicable).",
        "drugInteractions": "Interactions médicamenteuses importantes (notamment AINS, substituts de sel, lithium, cocaïne)."
      }
    ]
  },
- "dispensingAndCounseling": {
    "title": "Conseil Associé à l'Ordonnance et Rôle du Pharmacien",
    "essentialDispensingAdvice": {
      "title": "A. Conseils Essentiels à la délivrance",
      "medicationExplanation": "Explication du traitement médicamenteux : Nom, rôle, posologie, durée (traitement à vie), effets secondaires (insister sur l'hypotension orthostatique et les conseils associés), interactions et contre-indications clés (AINS, alcool, substituts de sel, produits naturels, grossesse/allaitement, cocaïne, marijuana).",
      "lifestyleReminder": "Rappel des Mesures Hygiéno-diététiques (MHD) : Importance fondamentale, conseils sur l'alimentation (sel, régime DASH, produits effervescents), poids, activité physique, tabac, alcool.",
      "monitoringAndSelfMeasurement": "Encourager l'automesure tensionnelle (AMT), l'utilisation d'autotensiomètres (plus de 60% des patients), la reconnaissance des signes d'alerte, et le contrôle en pharmacie.",
      "intercurrentEventManagement": "Avertir des risques de déshydratation (chaleurs, diarrhée, vomissements) surtout sous diurétiques."
    },
    "additionalSalesAndServices": {
      "title": "B. Ventes Additionnelles et Services Associés (Valorisation Commerciale et Clinique)",
      "products": [ "Autotensiomètres : Produit phare, formation à l'utilisation, interprétation des mesures.", "Piluliers et dispositifs d'aide à l'observance.", "Produits liés aux MHD : Substituts de sel (précautions), guides de régime DASH, aides au sevrage tabagique, produits de gestion du poids, compléments de potassium (si hypokaliémie).", "Autres produits pertinents : Brosses à dents à soies souples/rasoirs électriques pour patients sous anticoagulants, produits d'hydratation." ],
      "services": [ "Services de suivi pharmaceutique : Entretiens pharmaceutiques pour suivi d'observance, tolérance, efficacité." ]
    },
    "pharmacistRoleValorization": {
      "title": "C. Valorisation du Rôle du Pharmacien dans la Santé des Patients Hypertendus",
      "medicationExpertise": "Expertise en Médication et Sécurité : Spécialiste des médicaments, suivi informatique, prévention des interactions, bilan comparatif des médicaments (BCM), information sur les génériques.",
      "patientEducation": "Éducation et Accompagnement du Patient : Éducation sur la maladie et le traitement (observance), explications claires, responsabilisation (automesure), soutien personnalisé sur les MHD.",
      "interprofessionalCollaboration": "Travail avec le médecin, communication aux autres professionnels, évaluation des capacités fonctionnelles."
    }
  },
- "conclusion": "Récapituler l'importance du rôle multidisciplinaire et l'apport essentiel du pharmacien d'officine et du préparateur en pharmacie dans l'éducation, la surveillance et l'optimisation du traitement des patients hypertendus pour améliorer la santé publique.",
- "glossary": (array of objects) Une liste de 5 à 10 termes importants avec leur définition (`term` et `definition`).
- "media": (array of objects) 1 à 2 suggestions de médias (vidéo, infographie), avec `type`, `title`, et `url` (utiliser des placeholders si nécessaire).
- "quiz": (array of objects) Un quiz de 5 à 10 questions (`question`, `options`, `correctAnswerIndex`, `explanation`, `type`).
- "flashcards": (array of objects) Une liste de 5 à 10 flashcards (`question` et `answer`).

---
Texte source :
"${sourceText}"
---`
}

    console.log("Prompt sent to Gemini for Exhaustive MemoFiche:", prompt);

    const parts = [
        { text: prompt },
    ];

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        const jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);
        const generatedMemoFiche: ExhaustiveMemoFiche = JSON.parse(jsonText);

        return generatedMemoFiche;
    } catch (error) {
        console.error("Error generating exhaustive memo fiche:", error);
        throw new Error("Failed to generate exhaustive memo fiche from text.");
    }
};

export const getAssistantResponse = async (messages: ChatMessage[], caseContext: CaseStudy, knowledgeBaseContent: string): Promise<string> => {
    let knowledgeBaseInstruction = '';
    if (knowledgeBaseContent) {
        knowledgeBaseInstruction = `
        Voici la mémofiche qui sert de base de connaissances. Base tes réponses exclusivement sur ces informations.

        ---
        ${knowledgeBaseContent}
        ---
        `;
    }

    const systemInstruction = {
        role: "system",
        parts: [{
            text: `
        Tu es "PharmIA", un assistant pédagogique expert en pharmacie.
        Ton rôle est d'aider un étudiant à approfondir sa compréhension d'un cas de comptoir en se basant sur la mémofiche fournie.
        ${knowledgeBaseInstruction}
        Réponds aux questions de l'étudiant de manière concise, claire et encourageante.
        Formate tes réponses en Markdown (utilise des listes à puces, du gras, etc. pour une meilleure lisibilité).
        Base tes réponses UNIQUEMENT sur les informations fournies dans la mémofiche. Ne spécule pas et n'ajoute pas d'informations extérieures.
        Si une question sort du cadre de la mémofiche, réponds poliment que tu ne peux répondre qu'aux questions relatives à la mémofiche.
        Adopte un ton amical et professionnel. Ne te présente pas à nouveau.
    `}]
    };

    function toContent(message: ChatMessage): Content {
    return {
        role: message.role,
        parts: [{ text: message.content }]
    };
}

// ...

    let chatHistory = messages;
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        chatHistory = chatHistory.slice(1);
    }

    const history: Content[] = chatHistory.map(toContent);


    try {
        if (chatHistory.length > 0) {
            console.log("Sending message to Gemini:", chatHistory.slice(-1)[0].content); // Log the last message sent
        }
        console.log("System instruction sent to Gemini:", systemInstruction.parts[0].text); // Log the system instruction

        const result = await model.generateContent({
            contents: history,
            systemInstruction: systemInstruction.parts[0].text,
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        console.log("Raw response from Gemini:", response.text()); // Log the raw response
        return response.text();

    } catch (error) {
        console.error("Error getting assistant response from Gemini:", error); // More specific error message
        throw new Error("Failed to get assistant response.");
    }
};
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, PharmacologyMemoFiche, ExhaustiveMemoFiche } from '../types';
import clientPromise from './mongo';
import { ObjectId } from 'mongodb';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
    // In a server environment, you might want to throw an error to prevent the app from starting
    // throw new Error("GEMINI_API_KEY is not configured."); 
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig: GenerationConfig = {
    temperature: 0.2,
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

const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Helper function to extract JSON from a string that might contain markdown or other text
function extractJsonFromString(text: string): string {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1];
    }
    // If no markdown block, assume the whole text is potentially JSON or needs fixing
    return text;
}

export const getEmbedding = async (text: string): Promise<number[]> => {
    try {
        const result = await embeddingModel.embedContent(text);
        const embedding = result.embedding;
        if (!embedding || !embedding.values) {
            throw new Error("L'embedding n'a pas pu être généré.");
        }
        return embedding.values;
    } catch (error) {
        console.error("Erreur lors de la génération de l'embedding:", error);
        throw new Error("Échec de la génération de l'embedding à partir du texte.");
    }
};

export const generateCaseStudyFromText = async (text: string, theme: string, system: string): Promise<CaseStudy> => {
    const prompt = `
      À partir du texte suivant, génère une mémofiche de cas de comptoir pour un préparateur en pharmacie.
      Le public cible de cette mémofiche est constitué de professionnels de santé (pharmaciens et préparateurs en pharmacie). Le contenu doit être rédigé avec un niveau de détail et de pertinence clinique adapté à cette audience, en évitant les conseils génériques destinés aux patients.
      La mémofiche doit être pertinente pour le thème "${theme}" et le système/organe "${system}".
      La mémofiche doit être structurée, claire, et pédagogique.
      Identifie un scénario patient plausible à partir du texte.
      Le ton doit être professionnel et didactique.

      **N'utilise PAS de recherche externe ou de connaissances préalables.** Base-toi uniquement sur le texte source fourni.

      Inclus les sections suivantes, en t'assurant que les tableaux sont bien des tableaux de chaînes de caractères ou d'objets selon le type:
      - "title": "Titre concis de la mémofiche",
      - "patientSituation": "Scénario patient détaillé",
      - "pathologyOverview": "Aperçu de la pathologie en 5-7 points clés (string[])",
      - "keyQuestions": "Tableau de chaînes de caractères (string[]) de questions clés à poser au patient",
      - "redFlags": "Tableau de chaînes de caractères (string[]) de signaux d'alerte",
      - "recommendations": {
        "mainTreatment": "Tableau de chaînes de caractères (string[]) résumant le traitement principal en points clés. Chaque point doit être très détaillé et inclure : le nom du traitement en gras (ex: **Nom du traitement**), la posologie précise (ex: **Amoxicilline**: Posologie: 1g 2 à 3 fois par jour), la durée du traitement (ex: Durée: 7 jours), les principales précautions d'emploi, contre-indications, interactions médicamenteuses pertinentes, et des conseils de dispensation spécifiques pour le pharmacien ou le préparateur (ex: surveillance, conseils au patient sur les effets indésirables spécifiques, gestion des interactions). Si le texte source ne fournit pas de détails précis, génère des exemples de posologies, durées, précautions et conseils plausibles et couramment admis pour un cas d'étude pédagogique destiné à des professionnels. Ne te contente pas de dire 'selon notice' ou des conseils génériques pour le patient.",
        "associatedProducts": "Tableau de chaînes de caractères (string[]) résumant les produits associés en points clés. Chaque point doit être très détaillé et inclure : la fonction du produit en gras, puis le nom du produit (ex: **Nom du produit**), la posologie précise, la durée d'utilisation, et des conseils de dispensation spécifiques pour le pharmacien ou le préparateur. 
        "lifestyleAdvice": "Tableau de chaînes de caractères (string[]) de conseils d'hygiène de vie",
        "dietaryAdvice": "Tableau de chaînes de caractères (string[]) de conseils alimentaires"
      },
      - "keyPoints": "Tableau de 3 à 4 points clés ultra-concis",
      - "references": "Tableau de chaînes de caractères (string[]) de jusqu'à 10 références bibliographiques pertinentes",
      - "flashcards": "Tableau de 10 flashcards (objets avec 'question' et 'answer')",
      - "glossary": "Tableau de 10 termes techniques (objets avec 'term' et 'definition')",
      - "media": "Tableau de 1 à 2 supports médias (objets avec 'title', 'type' ('video' ou 'infographic'), et 'url' - utilise des URLs de placeholder si tu ne peux pas générer de vraies URLs)",
      - "coverImageUrl": "URL d'une image de couverture pertinente. Utilise une URL de placeholder de https://picsum.photos si tu ne peux pas générer de vraie URL (par exemple, https://picsum.photos/1200/600)",
      - "youtubeUrl": "URL d'une vidéo YouTube pertinente. Utilise une URL de placeholder si tu ne peux pas générer de vraie URL (par exemple, https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
      - "quiz": "Tableau de 10 questions de quiz (objets QuizQuestion avec 'question', 'options', 'correctAnswerIndex', 'explanation', 'type' ('single-choice' ou 'true-false')). Pour Vrai/Faux, correctAnswerIndex est 0 pour 'Vrai' et 1 pour 'Faux'."

      Texte source:
      ---
      ${text}
      ---

      Génère la réponse au format JSON.
    `;

    console.log("Prompt sent to Gemini:", prompt); 

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
        let jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);

        // Extract JSON block from the response
        jsonText = extractJsonFromString(jsonText);

        let generatedCase: CaseStudy;
        try {
            generatedCase = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON, attempting to fix...", parseError);
            // Attempt to fix the glossary format issue
            jsonText = jsonText.replace(/"term": ("[^"]+"), "definition": ("[^"]+")/g, '{"term": $1, "definition": $2}');
            try {
                generatedCase = JSON.parse(jsonText);
                console.log("Successfully parsed JSON after fixing.");
            } catch (secondParseError) {
                console.error("Failed to parse JSON even after attempting to fix:", secondParseError);
                throw new Error("Failed to generate case study from text due to malformed JSON.");
            }
        }


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
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from text.");
    }
};

export const generatePharmacologyMemoFiche = async (sourceText: string, theme: string, pathology: string): Promise<PharmacologyMemoFiche> => {
    const prompt = `À partir du texte source fourni ci-dessous, génère une mémofiche de pharmacologie sur le thème de "${theme}", en te concentrant sur la pathologie de "${pathology}".

La mémofiche doit être structurée, claire et pédagogique, et doit viser à vulgariser les informations pour des étudiants en pharmacie.

La réponse doit être au format JSON, en respectant la structure suivante :

-   'title': 'Un titre concis et informatif pour la mémofiche',
-   'pathology': 'La pathologie principale concernée par ces classes pharmacologiques',
-   'pathologyOverview': 'Un bref aperçu de la pathologie en 3 à 5 points clés',
-   'introduction': 'Une brève introduction expliquant l'importance de ces classes de médicaments dans le traitement de la pathologie',
-   'pharmacologicalClasses': [
      {
        'className': 'Le nom de la classe pharmacologique',
        'mechanismOfAction': 'Une explication claire et détaillée du mécanisme d'action',
        'differentialAdvantages': 'Les avantages de cette classe par rapport à d'autres',
        'roleOfDiet': 'L'influence de l'alimentation sur le traitement',
        'drugs': [
          {
            'name': 'Le nom du médicament (DCI)',
            'dosages': 'Les posologies précises et courantes. Ne pas dire "selon notice"',
            'precautionsForUse': 'Les principales précautions d'emploi, contre-indications et effets indésirables'
          }
        ]
      }
    ],
-   'summaryTable': {
        'headers': ['Classe', 'Mécanisme d'action', 'Avantages', 'Exemples'],
        'rows': []
    },
-   'keyPoints': [],
-   'glossary': [],
-   'media': [],
-   'quiz': [],
-   'flashcards': []

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
        let jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);

        // Extract JSON block from the response
        jsonText = extractJsonFromString(jsonText);
        
        let generatedMemoFiche: PharmacologyMemoFiche;
        try {
            generatedMemoFiche = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON, attempting to fix...", parseError);
            // Attempt to fix the glossary format issue
            jsonText = jsonText.replace(/"term": ("[^"]+"), "definition": ("[^"]+")/g, '{"term": $1, "definition": $2}');
            try {
                generatedMemoFiche = JSON.parse(jsonText);
                console.log("Successfully parsed JSON after fixing.");
            } catch (secondParseError) {
                console.error("Failed to parse JSON even after attempting to fix:", secondParseError);
                throw new Error("Failed to generate pharmacology memo fiche from text due to malformed JSON.");
            }
        }

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

- 'title': 'Titre principal (ex: HTA et Antihypertenseurs)',
- 'targetAudience': 'Public cible (ex: Pharmaciens et Préparateurs)',
- 'objectives': [ 'Objectif 1', 'Objectif 2', '...' ],
- 'introductionToPathology': {
    'title': 'Introduction à l'Hypertension Artérielle (HTA)',
    'definitionAndDiagnosis': 'Inclure la définition de l'HTA (PA ≥ 140/90 mm Hg en consultation, maintenue dans le temps), les objectifs de PA pour différentes populations (générale, diabétiques, > 80 ans).',
    'prevalenceAndImportance': 'Mentionner que l'HTA est le premier facteur de risque cardiovasculaire mondial, sa nature souvent asymptomatique, et les statistiques sur le traitement et le contrôle.',
    'riskFactorsAndCauses': 'Lister les facteurs modifiables (surpoids, alcool, tabac, sédentarité, alimentation, hyperlipidémie, diabète) et les causes spécifiques (grossesse, troubles neurologiques, apnée du sommeil). Différencier l'HTA primaire et secondaire.',
    'complications': 'Décrire les risques liés à une HTA non traitée (AVC, insuffisance cardiaque, infarctus, etc.).',
    'treatmentGoals': 'Rappeler l'objectif principal de diminution de la morbimortalité cardiovasculaire et les cibles de PA.',
    'lifestyleMeasures': 'Détailler ces mesures essentielles (perte de poids, réduction du sel, modération de l'alcool, arrêt du tabac, activité physique, gestion du stress) et leur importance dans la prise en charge.'
  },
- 'drugClasses': {
    'title': 'Les Antihypertenseurs : Classes et Détails',
    'generalPrinciples': 'Indiquer que le traitement est généralement à vie, l'importance de la formation continue et des ouvrages de référence. Expliquer que le choix initial peut se faire entre différentes classes et que les associations sont envisagées en cas d'efficacité insuffisante (avec les associations à éviter comme IEC-ARA2 ou thiazidique-diurétique de l'anse).',
    'classes': [
      {
        'name': 'Antagonistes des Récepteurs de l'Angiotensine II (ARA II)',
        'examples': 'Noms génériques et commerciaux (avec des exemples).',
        'mechanismOfAction': 'Mécanisme d'action.',
        'mainSideEffects': 'Effets secondaires principaux.',
        'patientAdvice': 'Conseils pour le patient (si spécifiques à la classe, comme la prise des diurétiques ou les précautions d'hypotension orthostatique).',n        'contraindications': 'Contre-indications (y compris la grossesse et l'allaitement si applicable).',
        'drugInteractions': 'Interactions médicamenteuses importantes (notamment AINS, substituts de sel, lithium, cocaïne).',
      }
    ]
  },
- 'dispensingAndCounseling': {
    'title': 'Conseil Associé à l'Ordonnance et Rôle du Pharmacien',
    'essentialDispensingAdvice': {
      'title': 'A. Conseils Essentiels à la délivrance',
      'medicationExplanation': 'Explication du traitement médicamenteux : Nom, rôle, posologie, durée (traitement à vie), effets secondaires (insister sur l'hypotension orthostatique et les conseils associés), interactions et contre-indications clés (AINS, alcool, substituts de sel, produits naturels, grossesse/allaitement, cocaïne, marijuana).',
      'lifestyleReminder': 'Rappel des Mesures Hygiéno-diététiques (MHD) : Importance fondamentale, conseils sur l'alimentation (sel, régime DASH, produits effervescents), poids, activité physique, tabac, alcool.',
      'monitoringAndSelfMeasurement': 'Encourager l'automesure tensionnelle (AMT), l'utilisation d'autotensiomètres (plus de 60% des patients), la reconnaissance des signes d'alerte, et le contrôle en pharmacie.',
      'intercurrentEventManagement': 'Avertir des risques de déshydratation (chaleurs, diarrhée, vomissements) surtout sous diurétiques.',
    },
    'additionalSalesAndServices': {
      'title': 'B. Ventes Additionnelles et Services Associés (Valorisation Commerciale et Clinique)',
      'products': [ 'Autotensiomètres : Produit phare, formation à l'utilisation, interprétation des mesures.', 'Piluliers et dispositifs d'aide à l'observance.', 'Produits liés aux MHD : Substituts de sel (précautions), guides de régime DASH, aides au sevrage tabagique, produits de gestion du poids, compléments de potassium (si hypokaliémie).', 'Autres produits pertinents : Brosses à dents à soies souples/rasoirs électriques pour patients sous anticoagulants, produits d'hydratation.' ],
      'services': [ 'Services de suivi pharmaceutique : Entretiens pharmaceutiques pour suivi d'observance, tolérance, efficacité.' ],
    },
    'pharmacistRoleValorization': {
      'title': 'C. Valorisation du Rôle du Pharmacien dans la Santé des Patients Hypertendus',
      'medicationExpertise': 'Expertise en Médication et Sécurité : Spécialiste des médicaments, suivi informatique, prévention des interactions, bilan comparatif des médicaments (BCM), information sur les génériques.',
      'patientEducation': 'Éducation et Accompagnement du Patient : Éducation sur la maladie et le traitement (observance), explications claires, responsabilisation (automesure), soutien personnalisé sur les MHD.',
      'interprofessionalCollaboration': 'Travail avec le médecin, communication aux autres professionnels, évaluation des capacités fonctionnelles.',
    }
  },
- 'conclusion': 'Récapituler l'importance du rôle multidisciplinaire et l'apport essentiel du pharmacien d'officine et du préparateur en pharmacie dans l'éducation, la surveillance et l'optimisation du traitement des patients hypertendus pour améliorer la santé publique.',
- 'glossary': [],
- 'media': [],
- 'quiz': [],
- 'flashcards': []

---
Texte source :
'${sourceText}'
---`;

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
        let jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);

        // Extract JSON block from the response
        jsonText = extractJsonFromString(jsonText);
        
        let generatedMemoFiche: ExhaustiveMemoFiche;
        try {
            generatedMemoFiche = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON, attempting to fix...", parseError);
            // Attempt to fix the glossary format issue
            jsonText = jsonText.replace(/"term": ("[^"]+"), "definition": ("[^"]+")/g, '{"term": $1, "definition": $2}');
            try {
                generatedMemoFiche = JSON.parse(jsonText);
                console.log("Successfully parsed JSON after fixing.");
            } catch (secondParseError) {
                console.error("Failed to parse JSON even after attempting to fix:", secondParseError);
                throw new Error("Failed to generate exhaustive memo fiche from text due to malformed JSON.");
            }
        }

        return generatedMemoFiche;
    } catch (error) {
        console.error("Error generating exhaustive memo fiche:", error);
        throw new Error("Failed to generate exhaustive memo fiche from text.");
    }
};



export async function getCustomChatResponse(
    userMessage: string,
    chatHistory: { role: string; parts: string }[] = [],
    context?: string
): Promise<string> {
    try {
        // Vector search is disabled to avoid quota issues.
        // const queryEmbedding = await getEmbedding(userMessage);
        // const client = await clientPromise;
        // const db = client.db('pharmia');
        // const chunksCollection = db.collection('memofiche_chunks');
        // const searchResults = await chunksCollection.aggregate([
        //     {
        //         $vectorSearch: {
        //             index: 'vector_embedding_index',
        //             path: 'embedding',
        //             queryVector: queryEmbedding,
        //             numCandidates: 150,
        //             limit: 5
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             content: 1,
        //             score: { $meta: 'vectorSearchScore' }
        //         }
        //     }
        // ]).toArray();
        // const relevantContext = searchResults
        //     .filter(result => result.score > 0.75)
        //     .map(result => result.content)
        //     .join('\n\n---\n\n');

        const prompt = context
            ? `Vous êtes PharmIA, un assistant IA expert conçu pour les professionnels de la pharmacie. Votre mission est de fournir des réponses précises et professionnelles, basées **uniquement** sur le contenu de la mémofiche fournie.\n\n**Règles strictes:**\n1.  **Salutations:** Si le message de l'utilisateur est **uniquement** une salutation (ex: "Bonjour", "Salut"), répondez par "Bonjour ! En quoi puis-je vous aider concernant cette mémofiche ?". Ne donnez aucune autre information.\n2.  **Pertinence:** Pour toute autre question, votre réponse doit être **exclusivement** basée sur les informations contenues dans la mémofiche. Ne faites aucune supposition et n'utilisez pas de connaissances externes.\n3.  **Format de conseil:**\n    *   Pour les questions relatives au **traitement, aux conseils d'hygiène de vie ou aux conseils alimentaires**, commencez votre réponse par "Pour conseiller la patiente, voici ce que vous pouvez dire :".\n    *   Pour toutes les autres questions (symptômes, causes, etc.), répondez directement sans cette phrase d'introduction.\n    *   Utilisez un langage clair, des listes à puces, et mettez les termes clés en gras.\n4.  **Concision:** Fournissez des réponses concises et allez droit au but. Évitez les phrases trop longues.\n\n**Mémofiche de référence:**\n---\n${context}\n---\n\n**Question de l'utilisateur:**\n${userMessage}`
            : `Vous êtes un assistant expert en pharmacie. Répondez à la question de l'utilisateur.`;

        function toContent(message: { role: string; parts: string }): Content {
            return {
                role: message.role,
                parts: [{ text: message.parts }]
            };
        }
        const history: Content[] = chatHistory.map(toContent);

        const chat = model.startChat({
            history: history, // Include previous chat history if available
            generationConfig: {
                maxOutputTokens: 300,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        return response.text();

    } catch (error) {
        console.error('Error in getCustomChatResponse:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred in chat response generation';
        throw new Error(`Failed to get custom chat response: ${errorMessage}`);
    }
}
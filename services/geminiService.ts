import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, ExhaustiveMemoFiche } from '../types';
import clientPromise from './mongo';
import { ObjectId } from 'mongodb';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
    // In a server environment, you might want to throw an error to prevent the app from starting
    // throw new Error("GEMINI_API_KEY is not configured."); 
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

export async function getEmbedding(texts: string[]): Promise<number[][]> {
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const requests = texts.map(text => ({ content: { parts: [{ text: text }] } as Content }));
        const result = await model.batchEmbedContents({ requests });
        return result.embeddings.map(embedding => embedding.values);
    } catch (error) {
        console.error("Erreur lors de la génération de l'embedding:", error);
        throw new Error("Échec de la génération de l'embedding à partir du texte.");
    }
}

export const generateCaseStudyFromText = async (text: string, theme: string, system: string): Promise<CaseStudy> => {
    const prompt = `Génère une mémofiche au format JSON à partir du texte suivant. Le JSON doit contenir les champs 'title', 'patientSituation', 'pathologyOverview', 'keyQuestions', 'redFlags', 'recommendations', 'flashcards', 'quiz', 'glossary', et 'references'.

Le champ 'pathologyOverview' doit être une description textuelle concise de la pathologie, et non un objet.
Le champ 'recommendations.mainTreatment' doit être un tableau de chaînes de caractères, où chaque chaîne décrit un traitement principal de manière détaillée, incluant posologie, durée et conseils de dispensation.
Le champ 'recommendations.associatedProducts' doit être un tableau de chaînes de caractères, où chaque chaîne représente un produit associé et son titre doit être en gras (ex: "**Titre du produit** : description").
Le champ 'recommendations.lifestyleAdvice' doit être un tableau de chaînes de caractères détaillant les conseils d'hygiène de vie.

Pour les 'flashcards', génère 10 questions-réponses pertinentes basées sur le texte. Chaque flashcard doit avoir une 'question' et une 'answer'.
Pour le 'quiz', génère 10 questions basées sur le texte, dont 4 questions Vrai/Faux et 6 questions à choix multiples. Chaque question doit avoir une 'question', un tableau d''options', l'index de la 'correctAnswerIndex', une 'explanation' et un 'type' ('single-choice' ou 'true-false').
Pour le 'glossary', extrais 10 termes clés du texte avec leurs 'definition' respectives.
Pour les 'references', extrais toutes les références bibliographiques pertinentes du texte source, formate-les selon les bonnes pratiques (auteur, titre, année, source) et assure-toi qu'elles soient concises.

Texte à analyser:
${text}`;;

            console.log("Prompt sent to Gemini:", prompt); 
    
            const parts = [
                { text: prompt },
            ];
    
            try {
                const result = await model.generateContent({
                                contents: [{ role: "user", parts }],
                                generationConfig,
                                safetySettings,                });
        const response = result.response;
        let jsonText = response.text();
        console.log("Raw JSON from Gemini:", jsonText);

        // Extract JSON block from the response
        jsonText = extractJsonFromString(jsonText);

        let generatedCase: CaseStudy | null = null;
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                generatedCase = JSON.parse(jsonText);
                console.log("Successfully parsed JSON.");
                break; // Exit loop if parsing is successful
            } catch (parseError) {
                console.error(`Failed to parse JSON (attempt ${retries + 1}/${maxRetries}), attempting to fix...`, parseError);
                // Attempt to fix the glossary format issue (existing fix)
                jsonText = jsonText.replace(/"term": ("[^"].*?"), "definition": ("[^"].*?")/g, '{"term": $1, "definition": $2}');
                
                // If parsing fails, we will re-prompt the model with the malformed JSON to correct it.
                // No heuristic fixing here, as it's unreliable.


                try {
                    generatedCase = JSON.parse(jsonText);
                    console.log("Successfully parsed JSON after fixing.");
                    break; // Exit loop if parsing is successful after fixing
                } catch (secondParseError) {
                    console.error(`Failed to parse JSON even after attempting to fix (attempt ${retries + 1}/${maxRetries}):`, secondParseError);
                    retries++;
                    if (retries < maxRetries) {
                        console.log("Retrying Gemini API call...");
                        const retryPrompt = `The previous JSON output was malformed. Please correct it. Original prompt: ${prompt}\nMalformed JSON: ${jsonText}`;
                        const retryParts = [
                            { text: retryPrompt },
                        ];
                        // Re-call Gemini API to get a new response
                        const result = await model.generateContent({
                            contents: [{ role: "user", parts: retryParts }],
                            generationConfig,
                            safetySettings,
                        });
                        const response = result.response;
                        jsonText = response.text();
                        jsonText = extractJsonFromString(jsonText); // Extract JSON block again
                        console.log("Raw JSON from Gemini (retry):", jsonText);
                    } else {
                        throw new Error("Failed to generate case study from text due to consistently malformed JSON after multiple retries.");
                    }
                }
            }
        }


        if (!generatedCase) {
            throw new Error("Failed to generate case study from text due to consistently malformed JSON after multiple retries.");
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
        return generatedCase as CaseStudy;
    } catch (error) {
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from text.");
    }
};


La réponse doit être exclusivement au format JSON et suivre rigoureusement la structure suivante :

- 'title': 'Titre principal (ex: HTA et Antihypertenseurs)',
- 'targetAudience': 'Public cible (ex: Pharmaciens et Préparateurs)',
- 'objectives': [ 'Objectif 1', 'Objectif 2', '...' ],
- 'introductionToPathology': {
    'title': 'Introduction à l Hypertention Artérielle (HTA)',
    'definitionAndDiagnosis': 'Inclure la définition de l HTA (PA ≥ 140/90 mm Hg en consultation, maintenue dans le temps), les objectifs de PA pour différentes populations (générale, diabétiques, > 80 ans).',
    'prevalenceAndImportance': 'Mentionner que l HTA est le premier facteur de risque cardiovasculaire mondial, sa nature souvent asymptomatique, et les statistiques sur le traitement et le contrôle.',
    'riskFactorsAndCauses': 'Lister les facteurs modifiables (surpoids, alcool, tabac, sédentarité, alimentation, hyperlipidémie, diabète) et les causes spécifiques (grossesse, troubles neurologiques, apnée du sommeil). Différencier l HTA primaire et secondaire.',
    'complications': 'Décrire les risques liés à une HTA non traitée (AVC, insuffisance cardiaque, infarctus, etc.).',
    'treatmentGoals': 'Rappeler l objectif principal de diminution de la morbimortalité cardiovasculaire et les cibles de PA.',
    'lifestyleMeasures': 'Détailler ces mesures essentielles (perte de poids, réduction du sel, modération de l alcool, arrêt du tabac, activité physique, gestion du stress) et leur importance dans la prise en charge).'
  },
- 'drugClasses': {
    'title': 'Les Antihypertenseurs : Classes et Détails',
    'generalPrinciples': 'Indiquer que le traitement est généralement à vie, l importance de la formation continue et des ouvrages de référence. Expliquer que le choix initial peut se faire entre différentes classes et que les associations sont envisagées en cas d efficacité insuffisante (avec les associations à éviter comme IEC-ARA2 ou thiazidique-diurétique de l anse).',
    'classes': [
      {
        'name': 'Antagonistes des Récepteurs de l Angiotensine II (ARA II)',
        'examples': 'Noms génériques et commerciaux (avec des exemples).',
        'mechanismOfAction': 'Mécanisme d action.',
        'mainSideEffects': 'Effets secondaires principaux.',
        'patientAdvice': 'Conseils pour le patient (si spécifiques à la classe, comme la prise des diurétiques ou les précautions d hypotention orthostatique).',\n        'contraindications': 'Contre-indications (y compris la grossesse et l allaitement si applicable).',
        'drugInteractions': 'Interactions médicamenteuses importantes (notamment AINS, substituts de sel, lithium, cocaïne).',
      }
    ]
  },
- 'dispensingAndCounseling': {
    'title': 'Conseil Associé à l Ordonnance et Rôle du Pharmacien',
    'essentialDispensingAdvice': {
      'title': 'A. Conseils Essentiels à la délivrance',
      'medicationExplanation': 'Explication du traitement médicamenteux : Nom, rôle, posologie, durée (traitement à vie), effets secondaires (insister sur l hypotention orthostatique et les conseils associés), interactions et contre-indications clés (AINS, alcool, substituts de sel, produits naturels, grossesse/allaitement, cocaïne, marijuana).',
      'lifestyleReminder': 'Rappel des Mesures Hygiéno-diététiques (MHD) : Importance fondamentale, conseils sur l alimentation (sel, régime DASH, produits effervescents), poids, activité physique, tabac, alcool.',
      'monitoringAndSelfMeasurement': 'Encourager l automesure tensionnelle (AMT), l utilisation d autotensiomètres (plus de 60% des patients), la reconnaissance des signes d alerte, et le contrôle en pharmacie.',
      'intercurrentEventManagement': 'Avertir des risques de déshydratation (chaleurs, diarrhée, vomissements) surtout sous diurétiques.',
    },
    'additionalSalesAndServices': {
      'title': 'B. Ventes Additionnelles et Services Associés (Valorisation Commerciale et Clinique)',
      'products': [ 'Autotensiomètres : Produit phare, formation à l utilisation, interprétation des mesures.', 'Piluliers et dispositifs d aide à l observance.', 'Produits liés aux MHD : Substituts de sel (précautions), guides de régime DASH, aides au sevrage tabagique, produits de gestion du poids, compléments de potassium (si hypokaliémie).', 'Autres produits pertinents : Brosses à dents à soies souples/rasoirs électriques pour patients sous anticoagulants, produits d hydratation.' ],
      'services': [ 'Services de suivi pharmaceutique : Entretiens pharmaceutiques pour suivi d observance, tolérance, efficacité.' ],
    },
    'pharmacistRoleValorization': {
      'title': 'C. Valorisation du Rôle du Pharmacien dans la Santé des Patients Hypertendus',
      'medicationExpertise': 'Expertise en Médication et Sécurité : Spécialiste des médicaments, suivi informatique, prévention des interactions, bilan comparatif des médicaments (BCM), information sur les génériques.',
      'patientEducation': 'Éducation et Accompagnement du Patient : Éducation sur la maladie et le traitement (observance), explications claires, responsabilisation (automesure), soutien personnalisé sur les MHD.',
      'interprofessionalCollaboration': 'Travail avec le médecin, communication aux autres professionnels, évaluation des capacités fonctionnelles.',
    }
  },
- 'conclusion': 'Récapituler l importance du rôle multidisciplinaire et l apport essentiel du pharmacien d officine et du préparateur en pharmacie dans l éducation, la surveillance et l optimisation du traitement des patients hypertendus pour améliorer la santé publique.',
- 'glossary': [
        {
            'term': 'Terme 1',
            'definition': 'Définition du terme 1'
        },
        {
            'term': 'Terme 2',
            'definition': 'Définition du terme 2'
        }
    ], // Génère 10 termes clés du texte avec leurs définitions
- 'media': [],
- 'quiz': [
        {
            'question': 'Question 1',
            'options': ['Option A', 'Option B', 'Option C'],
            'correctAnswerIndex': 0,
            'explanation': 'Explication de la réponse correcte',
            'type': 'single-choice'
        },
        {
            'question': 'Question 2',
            'options': ['Vrai', 'Faux'],
            'correctAnswerIndex': 1,
            'explanation': 'Explication de la réponse correcte',
            'type': 'true-false'
        }
    ], // Génère 10 questions basées sur le texte, dont 4 questions Vrai/Faux et 6 questions à choix multiples.
- 'flashcards': [
        {
            'question': 'Question flashcard 1',
            'answer': 'Réponse flashcard 1'
        },
        {
            'question': 'Question flashcard 2',
            'answer': 'Réponse flashcard 2'
        }
    ], // Génère 10 questions-réponses pertinentes basées sur le texte
- 'references': [], // Extrait toutes les références bibliographiques du texte source, formate-les selon les bonnes pratiques (auteur, titre, année, source) et assure-toi qu elles soient concises.

`;
};


export async function getCustomChatResponse(
    userMessage: string,
    chatHistory: { role: string; parts: string }[] = [],
    context?: string
): Promise<string> {
    return "Simplified response for testing.";
}

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, ExhaustiveMemoFiche } from '../types';
import clientPromise from './mongo';
import { ObjectId } from 'mongodb';
import { ensureArray } from '../utils/array';

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
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const requests = texts.map(text => ({ content: { parts: [{ text: text }] } as Content }));
        const result = await model.batchEmbedContents({ requests });
        return result.embeddings.map(embedding => embedding.values);
    } catch (error: any) {
        if (error.name === 'GoogleGenerativeAIFetchError' && error.status === 429) {
            console.warn("Quota exceeded for embedding generation. Returning empty embeddings. Please check your Google Cloud project's billing and quotas.");
            return [];
        } else {
            console.error("Erreur lors de la génération de l'embedding:", error);
            throw new Error("Échec de la génération de l'embedding à partir du texte.");
        }
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
                console.error(`Malformed JSON before parsing (attempt ${retries + 1}/${maxRetries}):`, jsonText);
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


        if (!generatedCase) {
            throw new Error("Failed to generate case study from text due to consistently malformed JSON after multiple retries.");
        }

        const ensureArray = <T>(value: T | T[] | undefined): T[] => {
            if (Array.isArray(value)) {
              return value;
            }
            if (value === undefined || value === null) {
              return [];
            }
            return [value] as T[]; // If it's a single value, wrap it in an array
          };

        // Post-processing to ensure all array fields are indeed arrays
        generatedCase.keyQuestions = ensureArray(generatedCase.keyQuestions);
        generatedCase.redFlags = ensureArray(generatedCase.redFlags);
        generatedCase.keyPoints = ensureArray(generatedCase.keyPoints);
        generatedCase.references = ensureArray(generatedCase.references);
        generatedCase.flashcards = ensureArray(generatedCase.flashcards);
        generatedCase.glossary = ensureArray(generatedCase.glossary);
        generatedCase.media = ensureArray(generatedCase.media);
        generatedCase.quiz = ensureArray(generatedCase.quiz);
        generatedCase.memoSections = ensureArray(generatedCase.memoSections);

        if (generatedCase.recommendations) {
            generatedCase.recommendations.mainTreatment = ensureArray(generatedCase.recommendations.mainTreatment);
            generatedCase.recommendations.associatedProducts = ensureArray(generatedCase.recommendations.associatedProducts);
            generatedCase.recommendations.lifestyleAdvice = ensureArray(generatedCase.recommendations.lifestyleAdvice);
            generatedCase.recommendations.dietaryAdvice = ensureArray(generatedCase.recommendations.dietaryAdvice);
        } else {
            generatedCase.recommendations = {
                mainTreatment: [],
                associatedProducts: [],
                lifestyleAdvice: [],
                dietaryAdvice: [],
            };
        }

        console.log("Parsed CaseStudy object (after transformation):", generatedCase);
        return generatedCase as CaseStudy;
    } catch (error) {
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from text.");
    }
};


export async function getCustomChatResponse(
    userMessage: string,
    chatHistory: { role: string; parts: string }[] = [],
    context?: string
): Promise<string> {
    return "Simplified response for testing.";
}

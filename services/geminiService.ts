import { GoogleGenAI, Type } from "@google/genai";
import type { CaseStudy, ChatMessage, QuizQuestion } from '../types';

// FIX: Initialize the Google GenAI client according to guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Use the recommended model 'gemini-2.5-flash'.
const model = 'gemini-2.5-flash';

// Define response schemas for structured outputs
const caseStudySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "Titre concis et informatif du cas clinique." },
        patientSituation: { type: Type.STRING, description: "Description de la situation du patient, incluant ses symptômes et sa demande." },
        pathologyOverview: { type: Type.STRING, description: "Un bref aperçu de la pathologie concernée, expliquant ses mécanismes de base et ses manifestations." },
        keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste des questions clés à poser au patient pour évaluer la situation." },
        recommendations: {
            type: Type.OBJECT,
            description: "Recommandations structurées en quatre catégories distinctes.",
            properties: {
                mainTreatment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conseils sur le traitement principal." },
                associatedProducts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggestions de produits complémentaires." },
                lifestyleAdvice: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conseils sur l'hygiène de vie." },
                dietaryAdvice: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conseils alimentaires." },
            },
            required: ['mainTreatment', 'associatedProducts', 'lifestyleAdvice', 'dietaryAdvice'],
        },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste des signaux d'alerte nécessitant une consultation médicale." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 3-4 points clés très concis qui résument les informations les plus critiques du cas." },
        references: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 1 à 3 références bibliographiques ou sources." },
        flashcards: {
            type: Type.ARRAY,
            description: "Liste de 10 flashcards (question/réponse) pour réviser les points clés.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                },
                required: ['question', 'answer']
            }
        },
        glossary: {
            type: Type.ARRAY,
            description: "Liste de 10 termes techniques ou importants avec leur définition.",
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                },
                required: ['term', 'definition']
            }
        },
        media: {
            type: Type.ARRAY,
            description: "Liste de 1-2 suggestions de médias (vidéo, infographie) avec titre et description.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['video', 'infographic'] }
                },
                required: ['title', 'description', 'type']
            }
        },
        quiz: {
            type: Type.ARRAY,
            description: "Liste de 10 questions de quiz (QCM ou Vrai/Faux) sur le cas clinique.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING, description: "Brève explication de la bonne réponse." },
                    type: { type: Type.STRING, enum: ['single-choice', 'true-false'] }
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'type']
            }
        }
    },
    required: ['title', 'patientSituation', 'pathologyOverview', 'keyQuestions', 'recommendations', 'redFlags', 'keyPoints', 'references', 'flashcards', 'glossary', 'media', 'quiz']
};

export const generateCaseStudyFromText = async (text: string, theme: string, system: string): Promise<CaseStudy> => {
    const prompt = `
      À partir du texte suivant, génère une mémofiche de cas de comptoir pour un étudiant en pharmacie.
      La mémofiche doit être pertinente pour le thème "${theme}" et le système/organe "${system}".
      La mémofiche doit être structurée, claire, et pédagogique.
      Identifie un scénario patient plausible à partir du texte.
      Le ton doit être professionnel et didactique.

      Inclus les sections suivantes:
      - "title", "patientSituation", "pathologyOverview", "keyQuestions", "redFlags".
      - "recommendations": Structure cette section en 4 sous-sections : "mainTreatment", "associatedProducts", "lifestyleAdvice", "dietaryAdvice".
      - "keyPoints": Crée 3 à 4 points clés ultra-concis.
      - "references": Fournis 1 à 3 références bibliographiques pertinentes.
      - "flashcards": Crée 10 flashcards (question/réponse).
      - "glossary": Définis 10 termes techniques.
      - "media": Suggère 1 à 2 supports médias (vidéo, infographie). Ne génère pas d'URL.
      - "quiz": Génère un quiz de 10 questions pertinentes (mélange de QCM à 4 options et Vrai/Faux). Pour Vrai/Faux, correctAnswerIndex est 0 pour "Vrai" et 1 pour "Faux".

      Texte source:
      ---
      ${text}
      ---

      Génère la réponse au format JSON en respectant le schéma fourni.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: caseStudySchema,
                temperature: 0.5,
            },
        });
        
        // FIX: Extract JSON string from response.text property as per guidelines.
        const jsonText = response.text.trim();
        const generatedCase: CaseStudy = JSON.parse(jsonText);
        return generatedCase;
    } catch (error) {
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from text.");
    }
};

export const getAssistantResponse = async (messages: ChatMessage[], caseContext: CaseStudy): Promise<string> => {
    const lastUserMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    const caseStudyText = `
        Voici le contexte de l'étude de cas sur laquelle tu dois te baser :
        - Titre: ${caseContext.title}
        - Situation: ${caseContext.patientSituation}
        - Recommandations: Traitement: ${caseContext.recommendations.mainTreatment.join(', ')}, Produits associés: ${caseContext.recommendations.associatedProducts.join(', ')}, Hygiène de vie: ${caseContext.recommendations.lifestyleAdvice.join(', ')}, Alimentation: ${caseContext.recommendations.dietaryAdvice.join(', ')}
        - Signaux d'alerte: ${caseContext.redFlags.join(', ')}
    `;

    const systemInstruction = `
        Tu es "PharmIA", un assistant pédagogique expert en pharmacie.
        Ton rôle est d'aider un étudiant à approfondir sa compréhension d'un cas de comptoir.
        ${caseStudyText}
        Réponds aux questions de l'étudiant de manière concise, claire et encourageante.
        Base tes réponses UNIQUEMENT sur les informations fournies dans le cas. Ne spécule pas et n'ajoute pas d'informations extérieures.
        Si une question sort du cadre du cas, réponds poliment que tu ne peux répondre qu'aux questions relatives à la mémofiche.
        Adopte un ton amical et professionnel. Ne te présente pas à nouveau.
    `;

    const historyString = history.map(m => `${m.role === 'user' ? 'Étudiant' : 'PharmIA'}: ${m.content}`).join('\n\n');
    
    const promptWithHistory = `
        Historique de la conversation:
        ---
        ${historyString}
        ---
        Nouvelle question de l'étudiant: "${lastUserMessage}"
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: promptWithHistory,
            config: {
                systemInstruction,
                temperature: 0.6,
            }
        });

        // FIX: Extract text response from response.text property.
        return response.text;

    } catch (error) {
        console.error("Error getting assistant response:", error);
        throw new Error("Failed to get assistant response.");
    }
};
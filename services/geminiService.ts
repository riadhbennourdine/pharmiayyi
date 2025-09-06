import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, ChatMessage } from '../types';

// WARNING: Storing API keys in client-side code is not secure.
// This is for development purposes only. In production, you should
// use a server-side proxy to handle API requests.
const API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; // Replace with your actual Gemini API Key or set as environment variable

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig: GenerationConfig = {
    temperature: 0.5,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
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

      Génère la réponse au format JSON.
    `;

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
        const generatedCase: CaseStudy = JSON.parse(jsonText);
        return generatedCase;
    } catch (error) {
        console.error("Error generating case study:", error);
        throw new Error("Failed to generate case study from text.");
    }
};

export const getAssistantResponse = async (messages: ChatMessage[], caseContext: CaseStudy): Promise<string> => {
    const caseStudyText = `
        Voici le contexte de l'étude de cas sur laquelle tu dois te baser :
        - Titre: ${caseContext.title}
        - Situation: ${caseContext.patientSituation}
        - Recommandations: Traitement: ${caseContext.recommendations.mainTreatment.join(', ')}, Produits associés: ${caseContext.recommendations.associatedProducts.join(', ')}, Hygiène de vie: ${caseContext.recommendations.lifestyleAdvice.join(', ')}, Alimentation: ${caseContext.recommendations.dietaryAdvice.join(', ')}
        - Signaux d'alerte: ${caseContext.redFlags.join(', ')}
    `;

    const systemInstruction = {
        role: "system",
        parts: [{
            text: `
        Tu es "PharmIA", un assistant pédagogique expert en pharmacie.
        Ton rôle est d'aider un étudiant à approfondir sa compréhension d'un cas de comptoir.
        ${caseStudyText}
        Réponds aux questions de l'étudiant de manière concise, claire et encourageante.
        Base tes réponses UNIQUEMENT sur les informations fournies dans le cas. Ne spécule pas et n'ajoute pas d'informations extérieures.
        Si une question sort du cadre du cas, réponds poliment que tu ne peux répondre qu'aux questions relatives à la mémofiche.
        Adopte un ton amical et professionnel. Ne te présente pas à nouveau.
    `}]
    };

    const history: Content[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));


    try {
        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history: [systemInstruction, ...history.slice(0, -1)],
        });

        const result = await chat.sendMessage(history.slice(-1)[0].parts);
        const response = result.response;
        return response.text();

    } catch (error) {
        console.error("Error getting assistant response:", error);
        throw new Error("Failed to get assistant response.");
    }
};
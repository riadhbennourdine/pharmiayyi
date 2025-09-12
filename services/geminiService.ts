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
      - "pathologyOverview": Aperçu de la pathologie.
      - "keyQuestions": Tableau de chaînes de caractères (string[]) de questions clés à poser au patient.
      - "redFlags": Tableau de chaînes de caractères (string[]) de signaux d'alerte.
      - "recommendations": Objet avec 4 sous-sections:
        - "mainTreatment": Tableau d'objets Treatment (avec les champs "medicament", "posologie", "duree", "conseil_dispensation").
        - "associatedProducts": Tableau d'objets Treatment (mêmes champs que mainTreatment).
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

        // Ensure recommendation sub-sections are arrays
        if (generatedCase.recommendations) {
            if (typeof generatedCase.recommendations.lifestyleAdvice === 'string') {
                generatedCase.recommendations.lifestyleAdvice = [generatedCase.recommendations.lifestyleAdvice];
            }
            if (typeof generatedCase.recommendations.dietaryAdvice === 'string') {
                generatedCase.recommendations.dietaryAdvice = [generatedCase.recommendations.dietaryAdvice];
            }
        }

        console.log("Parsed CaseStudy object (after transformation):", generatedCase);
        return generatedCase;
    } catch (error) {
        console.error("Error generating case study:", error); // Log l'erreur ici aussi
        throw new Error("Failed to generate case study from text.");
    }
};

export const getAssistantResponse = async (messages: ChatMessage[], caseContext: CaseStudy): Promise<string> => {
    const formatTreatments = (treatments: any[] | undefined) => {
        if (!treatments || treatments.length === 0) return 'Aucun';
        return treatments.map(t => t.medicament || t).join(', ');
    };

    const caseStudyText = `
        Voici le contexte de l'étude de cas sur laquelle tu dois te baser :
        - Titre: ${caseContext.title}
        - Situation: ${caseContext.patientSituation}
        - Recommandations: Traitement: ${formatTreatments(caseContext.recommendations.mainTreatment)}, Produits associés: ${formatTreatments(caseContext.recommendations.associatedProducts)}, Hygiène de vie: ${caseContext.recommendations.lifestyleAdvice.join(', ') || 'Aucun'}, Alimentation: ${caseContext.recommendations.dietaryAdvice.join(', ') || 'Aucun'}
        - Signaux d'alerte: ${caseContext.redFlags.join(', ') || 'Aucun'}
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

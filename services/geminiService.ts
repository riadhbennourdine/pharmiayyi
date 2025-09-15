import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from "@google/generative-ai";
import type { CaseStudy, ChatMessage, PharmacologyMemoFiche } from '../types';

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
        - "mainTreatment": Tableau de 10 chaînes de caractères (string[]) résumant le traitement principal en points clés. Chaque point doit inclure le nom du traitement en gras (ex: **Nom du traitement**), suivi de sa posologie et de sa durée (ex: **Nom du traitement**: Posologie: [valeur], Durée: [valeur]).
        - "associatedProducts": Tableau de 10 chaînes de caractères (string[]) résumant les produits associés en points clés. Chaque point doit inclure le nom du produit en gras (ex: **Nom du produit**), suivi de sa posologie et de sa durée (ex: **Nom du produit**: Posologie: [valeur], Durée: [valeur]).
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
        -   "dosages": (string) Les posologies courantes.
        -   "precautionsForUse": (string) Les principales précautions d'emploi.
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
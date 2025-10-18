import { GoogleGenAI, Type } from "@google/genai";
import type { Riddle, Difficulty } from '../types';

const API_KEY = "__GEMINI_API_KEY__";

if (API_KEY === "__GEMINI_API_KEY__") {
    // This will be true if the placeholder was not replaced.
    // It's better to fail gracefully in the UI. We will handle this in App.tsx
}

let ai: GoogleGenAI | null = null;
try {
   ai = new GoogleGenAI({ apiKey: API_KEY });
} catch (e) {
  // Error during initialization, will be handled in App.tsx
  console.error("Failed to initialize GoogleGenAI:", e);
}


const getPromptByDifficulty = (difficulty: Difficulty): string => {
    switch (difficulty) {
        case 'easy':
            return "أعطني لغز سهل ومناسب للأطفال باللهجة السعودية. اللغز يكون قصير وإجابته كلمة أو كلمتين بس.";
        case 'hard':
            return "أعطني لغز صعب شوي وذكي باللهجة السعودية ويتطلب تفكير. اللغز يكون قصير وإجابته كلمة أو كلمتين بس.";
        case 'medium':
        default:
            return "أعطني لغز ممتع باللهجة السعودية. اللغز يكون قصير وإجابته كلمة أو كلمتين بس.";
    }
};

const ensureAiInitialized = () => {
    if (!ai) {
        throw new Error("Gemini AI client is not initialized. Please check your API key.");
    }
    return ai;
}

export const isApiKeySet = () => API_KEY !== "__GEMINI_API_KEY__";

export async function generateRiddle(difficulty: Difficulty): Promise<Riddle> {
  const ai = ensureAiInitialized();
  try {
    const prompt = getPromptByDifficulty(difficulty);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    riddle: {
                        type: Type.STRING,
                        description: "نص اللغز باللهجة السعودية",
                    },
                    answer: {
                        type: Type.STRING,
                        description: "إجابة اللغز باللهجة السعودية",
                    },
                },
                required: ["riddle", "answer"],
            },
        },
    });

    const jsonText = response.text.trim();
    const parsedRiddle: Riddle = JSON.parse(jsonText);

    if (!parsedRiddle.riddle || !parsedRiddle.answer) {
        throw new Error("Invalid riddle format received from API");
    }

    return parsedRiddle;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate riddle. Please check the API key and network connection.");
  }
}

export async function generateTruthQuestion(): Promise<string> {
    const ai = ensureAiInitialized();
    const prompt = "أبغى سؤال صراحة قوووي ومحرج، باللهجة السعودية العامية حقت سواليف الشباب. سؤال يكشف أسرار أو يخلي الواحد يتوهق في الإجابة. عطني السؤال بس بدون أي إضافات.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 1,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for a truth question:", error);
        throw new Error("Failed to generate question.");
    }
}

export async function generateDare(): Promise<string[]> {
    const ai = ensureAiInitialized();
    const prompt = "أعطني 3 تحديات أو عقوبات مضحكة ومناسبة للعب عن بعد في روم صوتي، باللهجة السعودية الدارجة. التحديات يجب ألا تتطلب حركة جسدية كبيرة أو أدوات خاصة. أريد قائمة من 3 جمل نصية فقط.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 1.2, // Higher temperature for more creative/varied dares
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dares: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "نص التحدي باللهجة السعودية"
                            },
                            description: "قائمة من 3 تحديات. يجب أن تكون 3 تحديات بالضبط."
                        }
                    },
                    required: ["dares"],
                },
            },
        });
        const jsonText = response.text.trim();
        const parsed: { dares: string[] } = JSON.parse(jsonText);

        if (!parsed.dares || !Array.isArray(parsed.dares) || parsed.dares.length === 0) {
            throw new Error("Invalid dares format received from API");
        }

        return parsed.dares;
    } catch (error) {
        console.error("Error calling Gemini API for a dare:", error);
        throw new Error("Failed to generate dare.");
    }
}

export async function generateSpeedChallengeCategory(): Promise<string> {
    const ai = ensureAiInitialized();
    const prompt = "أعطني فئة واحدة ممتعة لتحدي سرعة، يمكن استخدامها في لعبة جماعية. مثلاً: 'أشياء تجدها في المطبخ'، 'دول عربية'، 'أسماء شخصيات كرتونية'. أريد اسم الفئة فقط بدون أي مقدمات أو شروحات.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 1.1,
            },
        });
        return response.text.trim().replace(/"/g, ''); // Clean quotes
    } catch (error) {
        console.error("Error calling Gemini API for a speed challenge category:", error);
        throw new Error("Failed to generate category.");
    }
}

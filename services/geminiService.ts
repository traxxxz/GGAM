import { GoogleGenAI, Type } from "@google/genai";
import type { Riddle, Difficulty } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export async function generateRiddle(difficulty: Difficulty): Promise<Riddle> {
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
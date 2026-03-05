import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NutritionInfo {
  foodName: string;
  calories: number;
  servingSize: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  description: string;
}

export async function getNutritionInfo(foodQuery: string): Promise<NutritionInfo> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide nutritional information for: ${foodQuery}. Be as accurate as possible for a standard serving.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          servingSize: { type: Type.STRING },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER, description: "grams of protein" },
              carbs: { type: Type.NUMBER, description: "grams of carbohydrates" },
              fat: { type: Type.NUMBER, description: "grams of fat" },
            },
            required: ["protein", "carbs", "fat"],
          },
          description: { type: Type.STRING },
        },
        required: ["foodName", "calories", "servingSize", "macros", "description"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

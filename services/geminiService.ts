
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDrivingInstruction = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a concise driving lesson or tip about: ${topic}. Focus on safety and technical skill.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            instruction: { type: Type.STRING }
          },
          required: ["title", "instruction"]
        }
      }
    });
    
    // Extract generated text using the .text property and parse as JSON
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini instruction error:", error);
    return {
      title: "Driving Instructor",
      instruction: "Keep your eyes on the road and maintain a steady speed."
    };
  }
};


import { GoogleGenAI, Type } from "@google/genai";

// Note: process.env.API_KEY is handled by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseResume = async (resumeText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following resume and extract key professional information. 
    Also, suggest 6-8 specific LinkedIn content topics this person could write about based on their expertise.
    Resume Text: ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          experienceLevel: { type: Type.STRING },
          suggestedTopics: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Industry-specific topics for LinkedIn posts"
          }
        },
        required: ["role", "skills", "suggestedTopics"]
      }
    }
  });
  return JSON.parse(response.text ?? "{}");
};

export const generateLinkedInPost = async (userData: {
  role: string;
  skills: string[];
  topic: string;
  tone?: string;
}) => {
  const prompt = `
    You are an expert LinkedIn ghostwriter. 
    Write a high-impact LinkedIn post for a ${userData.role} specializing in ${userData.skills.join(", ")}.
    Topic: ${userData.topic}
    Tone: ${userData.tone || 'Professional and engaging'}
    Requirements:
    - Catchy first line (hook)
    - Value-driven body with bullet points
    - Strong call to action
    - 3-5 relevant hashtags
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      temperature: 0.8,
    }
  });

  return response.text;
};

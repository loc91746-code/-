import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEcoFeedback = async (wattsSaved: number, survived: boolean): Promise<string> => {
  const client = getClient();
  if (!client) return "Thank you for saving energy! Keep up the good work.";

  const prompt = survived
    ? `I just played a game where I turned off computer screens to save electricity. I saved ${wattsSaved} Watts in 30 seconds. Write a very short, witty, and enthusiastic compliment (max 2 sentences) about my energy-saving skills and one quick real-world tip for saving PC power.`
    : `I played a game about turning off screens but I failed and the system overloaded. I only saved ${wattsSaved} Watts. Give me a short, encouraging roast (gentle humor) telling me to be faster next time to save the planet (max 2 sentences).`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Energy saved! Great job.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return survived 
      ? `Amazing reflex! You saved ${wattsSaved} Watts of pure energy.`
      : "System Overload! Try to move faster next time.";
  }
};

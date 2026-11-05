import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createGeminiModel(apiKey: string) {
  if (!apiKey.trim()) {
    throw new Error("A Gemini API key is required to create the AI model.");
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 2,
  });
}

import { GoogleGenAI } from "@google/genai";

export const getGeminiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};
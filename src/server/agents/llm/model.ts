import "server-only";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { getServerEnv } from "@/lib/config";

export type ModelRole = "reasoning" | "fast";

/**
 * Chat model factory. Roles let the orchestrator use a stronger model for
 * code-writing agents and a cheaper one for summaries, configured by env:
 * AGENT_MODEL (default gemini-2.5-pro) and AGENT_FAST_MODEL (default gemini-2.5-flash).
 */
export function createChatModel(role: ModelRole = "reasoning") {
  const model = role === "reasoning"
    ? process.env.AGENT_MODEL || "gemini-2.5-pro"
    : process.env.AGENT_FAST_MODEL || "gemini-2.5-flash";
  return new ChatGoogleGenerativeAI({
    apiKey: getServerEnv("GEMINI_API_KEY"),
    model,
    temperature: role === "reasoning" ? 0.2 : 0,
    maxOutputTokens: 8192,
    maxRetries: 3,
  });
}

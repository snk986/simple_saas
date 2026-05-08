import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import { openRouterProvider } from "./openrouter";
import type { AiProvider } from "./types";

type AiProviderName = "claude" | "gemini" | "openrouter";

function getProviderName(): AiProviderName {
  const provider = (process.env.AI_PROVIDER ?? "claude").toLowerCase();

  if (
    provider === "gemini" ||
    provider === "claude" ||
    provider === "openrouter"
  ) {
    return provider;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

export function getAiProvider(): AiProvider {
  const provider = getProviderName();

  if (provider === "openrouter") {
    return openRouterProvider;
  }

  return provider === "gemini" ? geminiProvider : claudeProvider;
}

export const analyzeInput: AiProvider["analyzeInput"] = (...args) =>
  getAiProvider().analyzeInput(...args);

export const generateLyrics: AiProvider["generateLyrics"] = (...args) =>
  getAiProvider().generateLyrics(...args);

export const generateJudgeReport: AiProvider["generateJudgeReport"] = (...args) =>
  getAiProvider().generateJudgeReport(...args);

export type { AiProvider, LyricsPromptInput } from "./types";

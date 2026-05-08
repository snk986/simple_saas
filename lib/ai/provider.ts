import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import type { AiProvider } from "./types";

type AiProviderName = "claude" | "gemini";

function getProviderName(): AiProviderName {
  const provider = (process.env.AI_PROVIDER ?? "claude").toLowerCase();

  if (provider === "gemini" || provider === "claude") {
    return provider;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

export function getAiProvider(): AiProvider {
  const provider = getProviderName();

  return provider === "gemini" ? geminiProvider : claudeProvider;
}

export const analyzeInput: AiProvider["analyzeInput"] = (...args) =>
  getAiProvider().analyzeInput(...args);

export const generateLyrics: AiProvider["generateLyrics"] = (...args) =>
  getAiProvider().generateLyrics(...args);

export const generateJudgeReport: AiProvider["generateJudgeReport"] = (...args) =>
  getAiProvider().generateJudgeReport(...args);

export type { AiProvider, LyricsPromptInput } from "./types";

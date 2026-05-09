import { claudeProvider } from "./claude";
import { githubModelsProvider } from "./github-models";
import type { AiProvider } from "./types";

type AiProviderName = "claude" | "github";

function getProviderName(): AiProviderName {
  const provider = (process.env.AI_PROVIDER ?? "github").toLowerCase();

  if (provider === "github" || provider === "claude") {
    return provider;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

export function getAiProvider(): AiProvider {
  const provider = getProviderName();

  if (provider === "github") {
    return githubModelsProvider;
  }

  return claudeProvider;
}

export const analyzeInput: AiProvider["analyzeInput"] = (...args) =>
  getAiProvider().analyzeInput(...args);

export const generateLyrics: AiProvider["generateLyrics"] = (...args) =>
  getAiProvider().generateLyrics(...args);

export const generateJudgeReport: AiProvider["generateJudgeReport"] = (...args) =>
  getAiProvider().generateJudgeReport(...args);

export type { AiProvider, LyricsPromptInput } from "./types";

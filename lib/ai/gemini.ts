import {
  buildAnalyzeInputPrompt,
  buildJudgeReportPrompt,
  buildLyricsPrompt,
  type InputAnalysis,
  type JudgeReportPromptInput,
  type LyricsDraft,
} from "./prompts";
import { AiProviderError, extractJson, normalizeJudgeReport } from "./shared";
import type { AiProvider, LyricsPromptInput } from "./types";
import type { JudgeReport } from "@/types/judge";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-pro";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}

function getGeminiModels() {
  const configuredModels = [
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS ?? "").split(","),
  ]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model));

  return Array.from(new Set(configuredModels.length ? configuredModels : [DEFAULT_MODEL]));
}

function shouldFallback(status: number) {
  return status === 429 || status >= 500;
}

async function requestGemini(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
  modelIndex = 0,
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AiProviderError("GEMINI_API_KEY is not configured");
  }

  const models = getGeminiModels();
  const model = models[modelIndex];
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 1800,
          responseMimeType: "application/json",
          temperature: options.temperature ?? 0.8,
        },
      }),
    },
  );

  if (!response.ok) {
    if (attempt === 0 && response.status >= 500) {
      return requestGemini(prompt, options, modelIndex, attempt + 1);
    }

    if (shouldFallback(response.status) && modelIndex < models.length - 1) {
      return requestGemini(prompt, options, modelIndex + 1);
    }

    throw new AiProviderError(
      `Gemini request failed with ${response.status} using ${model}`,
    );
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new AiProviderError(
      `Gemini returned an empty response${
        data.candidates?.[0]?.finishReason
          ? ` (${data.candidates[0].finishReason})`
          : ""
      }`,
    );
  }

  return text;
}

export const geminiProvider: AiProvider = {
  async analyzeInput(userInput: string, locale: string): Promise<InputAnalysis> {
    const text = await requestGemini(buildAnalyzeInputPrompt(userInput, locale), {
      temperature: 0.2,
    });

    return extractJson<InputAnalysis>(text, "Gemini");
  },

  async generateLyrics(input: LyricsPromptInput): Promise<LyricsDraft> {
    const text = await requestGemini(buildLyricsPrompt(input));
    const draft = extractJson<LyricsDraft>(text, "Gemini");

    return {
      title: draft.title.trim(),
      lyrics: draft.lyrics.trim(),
    };
  },

  async generateJudgeReport(
    input: JudgeReportPromptInput,
  ): Promise<JudgeReport> {
    const text = await requestGemini(buildJudgeReportPrompt(input), {
      maxTokens: 2600,
      temperature: 0.4,
    });
    const report = extractJson<JudgeReport>(text, "Gemini");

    return normalizeJudgeReport(report);
  },
};

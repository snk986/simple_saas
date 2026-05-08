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

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-pro";

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    finish_reason?: string;
  }>;
}

interface OpenRouterErrorResponse {
  error?: {
    code?: number | string;
    message?: string;
  };
}

function getOpenRouterModels() {
  const configuredModels = [
    process.env.OPENROUTER_MODEL,
    ...(process.env.OPENROUTER_FALLBACK_MODELS ?? "").split(","),
  ]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model));

  return Array.from(new Set(configuredModels.length ? configuredModels : [DEFAULT_MODEL]));
}

function shouldFallback(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function readOpenRouterError(response: Response) {
  try {
    const data = (await response.json()) as OpenRouterErrorResponse;
    return data.error?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

function extractText(data: OpenRouterChatResponse) {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  return content
    ?.map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .join("\n")
    .trim();
}

async function requestOpenRouter(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
  modelIndex = 0,
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AiProviderError("OPENROUTER_API_KEY is not configured");
  }

  const models = getOpenRouterModels();
  const model = models[modelIndex];
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer": process.env.BASE_URL ?? "https://hit-song-dev.vercel.app",
      "x-title": "Hit-Song",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens ?? 1800,
      response_format: { type: "json_object" },
      stream: false,
      temperature: options.temperature ?? 0.8,
    }),
  });

  if (!response.ok) {
    const errorMessage = await readOpenRouterError(response);

    if (attempt === 0 && response.status >= 500) {
      return requestOpenRouter(prompt, options, modelIndex, attempt + 1);
    }

    if (shouldFallback(response.status) && modelIndex < models.length - 1) {
      return requestOpenRouter(prompt, options, modelIndex + 1);
    }

    throw new AiProviderError(
      `OpenRouter request failed with ${response.status} using ${model}: ${errorMessage}`,
    );
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  const text = extractText(data);

  if (!text) {
    throw new AiProviderError(
      `OpenRouter returned an empty response${
        data.choices?.[0]?.finish_reason
          ? ` (${data.choices[0].finish_reason})`
          : ""
      }`,
    );
  }

  return text;
}

export const openRouterProvider: AiProvider = {
  async analyzeInput(userInput: string, locale: string): Promise<InputAnalysis> {
    const text = await requestOpenRouter(
      buildAnalyzeInputPrompt(userInput, locale),
      {
        temperature: 0.2,
      },
    );

    return extractJson<InputAnalysis>(text, "OpenRouter");
  },

  async generateLyrics(input: LyricsPromptInput): Promise<LyricsDraft> {
    const text = await requestOpenRouter(buildLyricsPrompt(input));
    const draft = extractJson<LyricsDraft>(text, "OpenRouter");

    return {
      title: draft.title.trim(),
      lyrics: draft.lyrics.trim(),
    };
  },

  async generateJudgeReport(
    input: JudgeReportPromptInput,
  ): Promise<JudgeReport> {
    const text = await requestOpenRouter(buildJudgeReportPrompt(input), {
      maxTokens: 2600,
      temperature: 0.4,
    });
    const report = extractJson<JudgeReport>(text, "OpenRouter");

    return normalizeJudgeReport(report);
  },
};

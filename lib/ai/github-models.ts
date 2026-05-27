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

const DEFAULT_API_URL =
  "https://models.inference.ai.azure.com/chat/completions";
const DEFAULT_MODEL = "gpt-4.1";

interface GitHubModelsChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    finish_reason?: string;
  }>;
}

interface GitHubModelsErrorResponse {
  error?: {
    code?: number | string;
    message?: string;
  };
}

function getGitHubModels() {
  const configuredModels = [
    process.env.GITHUB_MODELS_MODEL,
    ...(process.env.GITHUB_MODELS_FALLBACK_MODELS ?? "").split(","),
  ]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model));

  return Array.from(
    new Set(configuredModels.length ? configuredModels : [DEFAULT_MODEL]),
  );
}

function shouldFallback(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function readGitHubModelsError(response: Response) {
  try {
    const data = (await response.json()) as GitHubModelsErrorResponse;
    return data.error?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

function extractText(data: GitHubModelsChatResponse) {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  return content
    ?.map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .join("\n")
    .trim();
}

async function requestGitHubModels(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
  modelIndex = 0,
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;

  if (!apiKey) {
    throw new AiProviderError("GITHUB_MODELS_API_KEY is not configured");
  }

  const models = getGitHubModels();
  const model = models[modelIndex];
  const response = await fetch(
    process.env.GITHUB_MODELS_API_URL ?? DEFAULT_API_URL,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens ?? 1800,
        stream: false,
        temperature: options.temperature ?? 0.8,
      }),
    },
  );

  if (!response.ok) {
    const errorMessage = await readGitHubModelsError(response);

    if (attempt === 0 && response.status >= 500) {
      return requestGitHubModels(prompt, options, modelIndex, attempt + 1);
    }

    if (shouldFallback(response.status) && modelIndex < models.length - 1) {
      return requestGitHubModels(prompt, options, modelIndex + 1);
    }

    throw new AiProviderError(
      `GitHub Models request failed with ${response.status} using ${model}: ${errorMessage}`,
    );
  }

  const data = (await response.json()) as GitHubModelsChatResponse;
  const text = extractText(data);

  if (!text) {
    throw new AiProviderError(
      `GitHub Models returned an empty response${
        data.choices?.[0]?.finish_reason
          ? ` (${data.choices[0].finish_reason})`
          : ""
      }`,
    );
  }

  return text;
}

export const githubModelsProvider: AiProvider = {
  async analyzeInput(userInput: string, locale: string): Promise<InputAnalysis> {
    const text = await requestGitHubModels(
      buildAnalyzeInputPrompt(userInput, locale),
      {
        temperature: 0.2,
      },
    );

    return extractJson<InputAnalysis>(text, "GitHub Models");
  },

  async generateLyrics(input: LyricsPromptInput): Promise<LyricsDraft> {
    const text = await requestGitHubModels(buildLyricsPrompt(input));
    const draft = extractJson<LyricsDraft>(text, "GitHub Models");

    return {
      title: draft.title.trim(),
      lyrics: draft.lyrics.trim(),
      suno_style_prompt: draft.suno_style_prompt?.trim(),
      style_params: draft.style_params,
      style_tags: draft.style_tags,
      vocal_casting: draft.vocal_casting?.trim(),
      generation_notes: draft.generation_notes?.trim(),
    };
  },

  async generateJudgeReport(
    input: JudgeReportPromptInput,
  ): Promise<JudgeReport> {
    const text = await requestGitHubModels(buildJudgeReportPrompt(input), {
      maxTokens: 2600,
      temperature: 0.4,
    });
    const report = extractJson<JudgeReport>(text, "GitHub Models");

    return normalizeJudgeReport(report);
  },
};

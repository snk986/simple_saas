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

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

interface ClaudeMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

async function requestClaude(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new AiProviderError("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? 1800,
      temperature: options.temperature ?? 0.8,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    if (attempt === 0 && response.status >= 500) {
      return requestClaude(prompt, options, attempt + 1);
    }

    throw new AiProviderError(`Claude request failed with ${response.status}`);
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  const text = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new AiProviderError("Claude returned an empty response");
  }

  return text;
}

export const claudeProvider: AiProvider = {
  async analyzeInput(userInput: string, locale: string): Promise<InputAnalysis> {
    const text = await requestClaude(buildAnalyzeInputPrompt(userInput, locale));
    return extractJson<InputAnalysis>(text, "Claude");
  },

  async generateJudgeReport(
    input: JudgeReportPromptInput,
  ): Promise<JudgeReport> {
    const text = await requestClaude(buildJudgeReportPrompt(input), {
      maxTokens: 2600,
      temperature: 0.4,
    });
    const report = extractJson<JudgeReport>(text, "Claude");

    return normalizeJudgeReport(report);
  },

  async generateLyrics(input: LyricsPromptInput): Promise<LyricsDraft> {
    const text = await requestClaude(buildLyricsPrompt(input));
    const draft = extractJson<LyricsDraft>(text, "Claude");

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
};

export const analyzeInput = claudeProvider.analyzeInput;
export const generateLyrics = claudeProvider.generateLyrics;
export const generateJudgeReport = claudeProvider.generateJudgeReport;

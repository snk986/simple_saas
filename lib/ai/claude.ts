import {
  buildAnalyzeInputPrompt,
  buildJudgeReportPrompt,
  buildLyricsPrompt,
  type InputAnalysis,
  type JudgeReportPromptInput,
  type LyricsDraft,
} from "./prompts";
import type { SongStyle } from "@/config/styles";
import type {
  DimensionScore,
  JudgeReport,
  ScoreDimension,
} from "@/types/judge";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

interface ClaudeMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

class ClaudeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeError";
  }
}

const SCORE_DIMENSIONS: ScoreDimension[] = [
  "melody_potential",
  "lyric_quality",
  "emotional_resonance",
  "commercial_appeal",
  "originality",
];

function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new ClaudeError("Claude returned a non-JSON response");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function clampScore(value: unknown) {
  const score = Math.round(Number(value));

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(Math.max(score, 0), 100);
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeJudgeReport(report: JudgeReport): JudgeReport {
  const dimensionsByKey = new Map<ScoreDimension, DimensionScore>();

  if (Array.isArray(report.dimensions)) {
    report.dimensions.forEach((dimension) => {
      if (SCORE_DIMENSIONS.includes(dimension.dimension)) {
        dimensionsByKey.set(dimension.dimension, {
          dimension: dimension.dimension,
          score: clampScore(dimension.score),
          comment:
            typeof dimension.comment === "string"
              ? dimension.comment.trim()
              : "",
        });
      }
    });
  }

  const dimensions = SCORE_DIMENSIONS.map(
    (dimension) =>
      dimensionsByKey.get(dimension) ?? {
        dimension,
        score: 0,
        comment: "",
      },
  );
  const averageScore =
    dimensions.reduce((sum, dimension) => sum + dimension.score, 0) /
    dimensions.length;

  return {
    total_score: clampScore(report.total_score || averageScore),
    dimensions,
    producer_comment:
      typeof report.producer_comment === "string"
        ? report.producer_comment.trim()
        : "",
    emotional_value:
      typeof report.emotional_value === "string"
        ? report.emotional_value.trim()
        : "",
    market_positioning:
      typeof report.market_positioning === "string"
        ? report.market_positioning.trim()
        : "",
    hook_analysis:
      typeof report.hook_analysis === "string"
        ? report.hook_analysis.trim()
        : "",
    strengths: normalizeStringArray(report.strengths),
    improvements: normalizeStringArray(report.improvements),
    recommended_next_steps: normalizeStringArray(report.recommended_next_steps),
    share_summary:
      typeof report.share_summary === "string"
        ? report.share_summary.trim()
        : "",
    generated_at:
      typeof report.generated_at === "string" && report.generated_at.trim()
        ? report.generated_at
        : new Date().toISOString(),
  };
}

async function requestClaude(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {},
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ClaudeError("ANTHROPIC_API_KEY is not configured");
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

    throw new ClaudeError(`Claude request failed with ${response.status}`);
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  const text = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new ClaudeError("Claude returned an empty response");
  }

  return text;
}

export async function analyzeInput(
  userInput: string,
  locale: string,
): Promise<InputAnalysis> {
  const text = await requestClaude(buildAnalyzeInputPrompt(userInput, locale));
  return extractJson<InputAnalysis>(text);
}

export async function generateJudgeReport(
  input: JudgeReportPromptInput,
): Promise<JudgeReport> {
  const text = await requestClaude(buildJudgeReportPrompt(input), {
    maxTokens: 2600,
    temperature: 0.4,
  });
  const report = extractJson<JudgeReport>(text);

  return normalizeJudgeReport(report);
}

export async function generateLyrics(input: {
  userInput: string;
  locale: string;
  analysis: InputAnalysis;
  style: SongStyle;
  previousLyrics?: string;
}): Promise<LyricsDraft> {
  const text = await requestClaude(buildLyricsPrompt(input));
  const draft = extractJson<LyricsDraft>(text);

  return {
    title: draft.title.trim(),
    lyrics: draft.lyrics.trim(),
  };
}

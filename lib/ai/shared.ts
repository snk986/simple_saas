import type {
  DimensionScore,
  JudgeReport,
  ScoreDimension,
} from "@/types/judge";

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

const SCORE_DIMENSIONS: ScoreDimension[] = [
  "melody_potential",
  "lyric_quality",
  "emotional_resonance",
  "commercial_appeal",
  "originality",
];

export function extractJson<T>(text: string, providerName: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new AiProviderError(`${providerName} returned a non-JSON response`);
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

export function normalizeJudgeReport(report: JudgeReport): JudgeReport {
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

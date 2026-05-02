export type ScoreDimension =
  | "melody_potential"
  | "lyric_quality"
  | "emotional_resonance"
  | "commercial_appeal"
  | "originality";

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number; // 0-100
  comment: string;
}

export interface JudgeReport {
  total_score: number;
  dimensions: DimensionScore[];
  producer_comment: string;
  strengths: string[];
  improvements: string[];
  generated_at: string;
}

export interface JudgeReportResponse {
  songId: string;
  report: JudgeReport;
}

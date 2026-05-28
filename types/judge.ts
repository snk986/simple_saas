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
  emotional_mirror?: string;
  what_you_captured?: string;
  most_touching_moment?: string;
  listener_feeling?: string;
  gentle_polish?: string;
  producer_comment: string;
  emotional_value: string;
  market_positioning: string;
  hook_analysis: string;
  strengths: string[];
  improvements: string[];
  recommended_next_steps: string[];
  share_summary: string;
  generated_at: string;
}

export interface JudgeReportResponse {
  songId: string;
  report: JudgeReport;
}

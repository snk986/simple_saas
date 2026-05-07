import type { Locale } from "@/i18n/routing";

export const recallScenarios = [
  "draft_no_audio",
  "ready_no_report",
  "report_no_share",
  "inactive_creator",
] as const;

export type RecallScenario = (typeof recallScenarios)[number];

export type RecallCandidate = {
  userId: string;
  email: string;
  locale: Locale;
  scenario: RecallScenario;
  ctaUrl: string;
  songId?: string;
  songTitle?: string;
  metadata?: Record<string, unknown>;
};

export type RecallRunStats = {
  sent: number;
  skipped: number;
  failed: number;
};

export function isRecallScenario(value: string): value is RecallScenario {
  return recallScenarios.includes(value as RecallScenario);
}

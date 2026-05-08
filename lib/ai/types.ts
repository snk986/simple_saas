import type { SongStyle } from "@/config/styles";
import type { JudgeReport } from "@/types/judge";
import type {
  InputAnalysis,
  JudgeReportPromptInput,
  LyricsDraft,
} from "./prompts";

export interface LyricsPromptInput {
  userInput: string;
  locale: string;
  analysis: InputAnalysis;
  style: SongStyle;
  previousLyrics?: string;
}

export interface AiProvider {
  analyzeInput(userInput: string, locale: string): Promise<InputAnalysis>;
  generateLyrics(input: LyricsPromptInput): Promise<LyricsDraft>;
  generateJudgeReport(input: JudgeReportPromptInput): Promise<JudgeReport>;
}

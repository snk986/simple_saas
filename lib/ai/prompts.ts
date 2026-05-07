import type { SongStyle } from "@/config/styles";

export interface InputAnalysis {
  flagged: boolean;
  reason?: string;
  emotion: string;
  theme: string;
  title_seed: string;
  style_key?: string;
  perspective: "first_person" | "second_person" | "third_person";
}

export interface LyricsDraft {
  title: string;
  lyrics: string;
}

export interface JudgeReportPromptInput {
  title: string;
  lyrics: string;
  userInput: string;
  styleParams: Record<string, unknown>;
  styleTags: string[];
  locale: string;
}

export function buildAnalyzeInputPrompt(userInput: string, locale: string) {
  return `Analyze this user story for an AI song creation flow.

Return only valid JSON with this shape:
{
  "flagged": boolean,
  "reason": string,
  "emotion": string,
  "theme": string,
  "title_seed": string,
  "style_key": "heartbreak" | "joy" | "nostalgia" | "empowerment" | "chill",
  "perspective": "first_person" | "second_person" | "third_person"
}

If the story contains hateful, sexually explicit, exploitative, graphic violent, self-harm instructional, or otherwise disallowed content, set flagged to true and provide a brief reason. Otherwise set flagged to false.

Locale for output lyrics later: ${locale}

Story:
${userInput}`;
}

export function buildLyricsPrompt(input: {
  userInput: string;
  locale: string;
  analysis: InputAnalysis;
  style: SongStyle;
  previousLyrics?: string;
}) {
  const previous = input.previousLyrics
    ? `Avoid repeating this previous draft too closely:\n${input.previousLyrics}`
    : "This is the first draft.";

  return `Write polished song lyrics from the user's story.

Return only valid JSON with this shape:
{
  "title": string,
  "lyrics": string
}

Rules:
- Write in locale "${input.locale}".
- Use a clear song structure with section labels like [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus].
- Keep the lyrics emotionally specific to the user's story.
- Make the chorus memorable and singable.
- Do not mention AI, prompts, platforms, or that this is generated.
- Do not include markdown fences.
- Keep the title under 8 words.

Story:
${input.userInput}

Analysis:
${JSON.stringify(input.analysis)}

Musical direction:
${input.style.prompt}

${previous}`;
}

export function buildJudgeReportPrompt(input: JudgeReportPromptInput) {
  return `Evaluate this song for an AI music creation report.

Return only valid JSON with this exact shape:
{
  "total_score": number,
  "dimensions": [
    {
      "dimension": "melody_potential" | "lyric_quality" | "emotional_resonance" | "commercial_appeal" | "originality",
      "score": number,
      "comment": string
    }
  ],
  "producer_comment": string,
  "emotional_value": string,
  "market_positioning": string,
  "hook_analysis": string,
  "strengths": string[],
  "improvements": string[],
  "recommended_next_steps": string[],
  "share_summary": string,
  "generated_at": string
}

Rules:
- Write the report in locale "${input.locale}".
- Include exactly these five dimensions: melody_potential, lyric_quality, emotional_resonance, commercial_appeal, originality.
- Every score must be an integer from 0 to 100.
- total_score must be an integer from 0 to 100 and should reflect the dimension scores.
- Be specific to the user's story and lyrics.
- Keep comments useful for a songwriter or producer.
- Do not make medical, legal, financial, or guaranteed commercial success claims.
- Do not mention prompts, API calls, hidden scoring logic, or that this is generated.
- Do not include markdown fences.
- Use generated_at as an ISO timestamp.

Song title:
${input.title}

Original user story:
${input.userInput}

Lyrics:
${input.lyrics}

Style params:
${JSON.stringify(input.styleParams)}

Style tags:
${input.styleTags.join(", ")}`;
}

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

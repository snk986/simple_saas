import { analyzeInput, generateLyrics } from "@/lib/ai/provider";
import { getSongStyle, matchSongStyle } from "@/config/styles";
import { defaultLocale, locales } from "@/config/i18n";

export function normalizeSongLocale(locale?: string) {
  return locales.includes(locale as any) ? locale! : defaultLocale;
}

export async function generateLyricsPreview(input: {
  userInput: string;
  locale?: string;
  previousLyrics?: string;
}) {
  const locale = normalizeSongLocale(input.locale);
  const analysis = await analyzeInput(input.userInput, locale);

  if (analysis.flagged) {
    return {
      flagged: true as const,
      reason: analysis.reason,
    };
  }

  const style =
    getSongStyle(analysis.style_key) ??
    matchSongStyle({
      emotion: analysis.emotion,
      theme: analysis.theme,
      story: input.userInput,
    });
  const draft = await generateLyrics({
    userInput: input.userInput,
    locale,
    analysis,
    style,
    previousLyrics: input.previousLyrics,
  });

  return {
    flagged: false as const,
    locale,
    title: draft.title,
    lyrics: draft.lyrics,
    style,
  };
}

export function buildStructuredUserInput(input: {
  mode: "text" | "lyrics";
  prompt?: string;
  style?: string;
  title?: string;
}) {
  const lines = [
    input.mode === "lyrics" ? "Mode: Lyrics to Song" : "Mode: Text to Song",
    input.title ? `Title: ${input.title}` : null,
    input.style ? `Style: ${input.style}` : null,
    input.prompt ? `Prompt: ${input.prompt}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

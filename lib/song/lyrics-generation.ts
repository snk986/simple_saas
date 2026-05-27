import { analyzeInput, generateLyrics } from "@/lib/ai/provider";
import { getSongStyle, matchSongStyle, type SongStyle } from "@/config/styles";
import { defaultLocale, locales } from "@/config/i18n";
import type { StyleParams } from "@/types/song";

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
  const generatedStyle = mergeGeneratedStyle(style, {
    prompt: draft.suno_style_prompt,
    params: draft.style_params,
    tags: draft.style_tags,
  });

  return {
    flagged: false as const,
    locale,
    title: draft.title,
    lyrics: draft.lyrics,
    style: generatedStyle,
    vocalCasting: draft.vocal_casting,
    generationNotes: draft.generation_notes,
  };
}

function mergeGeneratedStyle(
  baseStyle: SongStyle,
  generated: {
    prompt?: string;
    params?: StyleParams;
    tags?: string[];
  },
): SongStyle {
  const prompt = generated.prompt?.trim();
  const tags = generated.tags
    ?.map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    ...baseStyle,
    prompt: prompt || baseStyle.prompt,
    params: normalizeStyleParams(generated.params, baseStyle.params),
    tags: tags && tags.length > 0 ? tags : baseStyle.tags,
  };
}

function normalizeStyleParams(
  params: StyleParams | undefined,
  fallback: StyleParams,
): StyleParams {
  if (!params) {
    return fallback;
  }

  return {
    genre: stringOrFallback(params.genre, fallback.genre),
    bpm:
      typeof params.bpm === "number" && Number.isFinite(params.bpm)
        ? Math.round(params.bpm)
        : fallback.bpm,
    instruments:
      Array.isArray(params.instruments) && params.instruments.length > 0
        ? params.instruments
            .filter((instrument) => typeof instrument === "string")
            .map((instrument) => instrument.trim())
            .filter(Boolean)
            .slice(0, 8)
        : fallback.instruments,
    vocals: stringOrFallback(params.vocals, fallback.vocals),
    mood: stringOrFallback(params.mood, fallback.mood),
  };
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

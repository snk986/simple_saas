import type { StyleParams } from "@/types/song";

export type StyleKey =
  | "heartbreak"
  | "joy"
  | "nostalgia"
  | "empowerment"
  | "chill";

export interface SongStyle {
  key: StyleKey;
  label: string;
  matchTerms: string[];
  params: StyleParams;
  tags: string[];
  prompt: string;
}

export const SONG_STYLES: Record<StyleKey, SongStyle> = {
  heartbreak: {
    key: "heartbreak",
    label: "Heartbreak",
    matchTerms: ["heartbreak", "breakup", "grief", "lost love", "lonely"],
    params: {
      genre: "cinematic pop ballad",
      bpm: 72,
      instruments: ["piano", "soft strings", "subtle drums"],
      vocals: "emotional lead vocal",
      mood: "intimate and bittersweet",
    },
    tags: ["Ballad", "Emotional", "Piano"],
    prompt:
      "A cinematic pop ballad with intimate piano, soft strings, restrained drums, and an emotional lead vocal.",
  },
  joy: {
    key: "joy",
    label: "Joy",
    matchTerms: ["joy", "happy", "celebration", "excited", "bright"],
    params: {
      genre: "bright dance pop",
      bpm: 118,
      instruments: ["clean guitar", "synth bass", "claps", "bright keys"],
      vocals: "uplifting pop vocal",
      mood: "bright and celebratory",
    },
    tags: ["Pop", "Upbeat", "Bright"],
    prompt:
      "A bright dance-pop track with clean guitar, synth bass, claps, bright keys, and an uplifting pop vocal.",
  },
  nostalgia: {
    key: "nostalgia",
    label: "Nostalgia",
    matchTerms: ["nostalgia", "memory", "childhood", "past", "remember"],
    params: {
      genre: "warm indie pop",
      bpm: 92,
      instruments: ["acoustic guitar", "warm synth pads", "light drums"],
      vocals: "warm reflective vocal",
      mood: "wistful and warm",
    },
    tags: ["Indie Pop", "Warm", "Reflective"],
    prompt:
      "A warm indie-pop song with acoustic guitar, soft synth pads, light drums, and a reflective vocal.",
  },
  empowerment: {
    key: "empowerment",
    label: "Empowerment",
    matchTerms: ["strong", "survive", "overcome", "freedom", "power"],
    params: {
      genre: "anthemic pop rock",
      bpm: 104,
      instruments: ["electric guitars", "big drums", "bass", "synth layers"],
      vocals: "confident anthem vocal",
      mood: "bold and triumphant",
    },
    tags: ["Anthem", "Bold", "Pop Rock"],
    prompt:
      "An anthemic pop-rock song with electric guitars, big drums, driving bass, synth layers, and a confident lead vocal.",
  },
  chill: {
    key: "chill",
    label: "Chill",
    matchTerms: ["calm", "peace", "quiet", "late night", "relaxed"],
    params: {
      genre: "lo-fi alt pop",
      bpm: 84,
      instruments: ["soft electric piano", "muted guitar", "lo-fi drums"],
      vocals: "smooth understated vocal",
      mood: "calm and dreamy",
    },
    tags: ["Lo-fi", "Dreamy", "Smooth"],
    prompt:
      "A lo-fi alt-pop track with soft electric piano, muted guitar, gentle drums, and a smooth understated vocal.",
  },
};

export const DEFAULT_STYLE_KEY: StyleKey = "chill";

export function getSongStyle(styleKey?: string | null): SongStyle {
  if (styleKey && styleKey in SONG_STYLES) {
    return SONG_STYLES[styleKey as StyleKey];
  }

  return SONG_STYLES[DEFAULT_STYLE_KEY];
}

export function matchSongStyle(input: {
  emotion?: string;
  theme?: string;
  story?: string;
}): SongStyle {
  const haystack = `${input.emotion ?? ""} ${input.theme ?? ""} ${
    input.story ?? ""
  }`.toLowerCase();

  const match = Object.values(SONG_STYLES).find((style) =>
    style.matchTerms.some((term) => haystack.includes(term)),
  );

  return match ?? SONG_STYLES[DEFAULT_STYLE_KEY];
}

export const SEO_TOOL_PAGE_PATHS = {
  textToSong: "/text-to-song",
  lyricsToSong: "/lyrics-to-song",
  aiLyricsGenerator: "/ai-lyrics-generator",
} as const;

export type SeoToolPageKey = keyof typeof SEO_TOOL_PAGE_PATHS;

export const SEO_TOOL_PAGE_KEYS = Object.keys(
  SEO_TOOL_PAGE_PATHS,
) as SeoToolPageKey[];

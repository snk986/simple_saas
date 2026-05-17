export const SEO_TOOL_PAGE_PATHS = {
  aiSongMaker: "/ai-song-maker",
  aiTextToSong: "/ai-text-to-song",
  aiLyricsToSong: "/ai-lyrics-to-song",
  aiLyricsGenerator: "/ai-lyrics-generator",
} as const;

export type SeoToolPageKey = keyof typeof SEO_TOOL_PAGE_PATHS;

export const SEO_TOOL_PAGE_KEYS = Object.keys(
  SEO_TOOL_PAGE_PATHS,
) as SeoToolPageKey[];

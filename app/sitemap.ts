import type { MetadataRoute } from "next";
import type { Locale } from "@/i18n/routing";
import { SEO_TOOL_PAGE_KEYS, SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { getPublicSongsForSitemap } from "@/lib/song/public-song";
import { absoluteLocaleUrl, seoLocales } from "@/lib/i18n/urls";

export const dynamic = "force-dynamic";

function localizedEntries(path: string, priority: number) {
  return seoLocales.map((locale) => ({
    url: absoluteLocaleUrl(locale, path),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getPublicSongsForSitemap();

  return [
    ...localizedEntries("/", 1),
    ...localizedEntries("/about", 0.75),
    ...SEO_TOOL_PAGE_KEYS.flatMap((key) =>
      localizedEntries(SEO_TOOL_PAGE_PATHS[key], 0.9),
    ),
    ...localizedEntries("/pricing", 0.85),
    ...songs.flatMap((song) =>
      seoLocales.map((locale: Locale) => ({
        url: absoluteLocaleUrl(locale, `/song/${song.id}`),
        lastModified: new Date(song.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ),
  ];
}

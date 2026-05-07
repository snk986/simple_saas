import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/routing";
import { getPublicSongsForSitemap } from "@/lib/song/public-song";
import { absoluteLocaleUrl } from "@/lib/i18n/urls";

export const dynamic = "force-dynamic";

function localizedEntries(path: string, priority: number) {
  return locales.map((locale) => ({
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
    ...localizedEntries("/create", 0.9),
    ...localizedEntries("/pricing", 0.85),
    ...songs.flatMap((song) =>
      locales.map((locale: Locale) => ({
        url: absoluteLocaleUrl(locale, `/song/${song.id}`),
        lastModified: new Date(song.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ),
  ];
}

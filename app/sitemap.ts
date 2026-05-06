import type { MetadataRoute } from "next";
import { defaultLocale } from "@/config/i18n";
import { getPublicSongsForSitemap } from "@/lib/song/public-song";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

function localizedSongPath(locale: string, id: string) {
  return locale === defaultLocale ? `/song/${id}` : `/${locale}/song/${id}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getPublicSongsForSitemap();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...songs.map((song) => ({
      url: `${baseUrl}${localizedSongPath(song.locale, song.id)}`,
      lastModified: new Date(song.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

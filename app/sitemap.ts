import type { MetadataRoute } from "next";
import { blogArticles } from "@/config/blog-articles";
import { SEO_TOOL_PAGE_KEYS, SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { absoluteLocaleUrl, baseUrl, seoLocales } from "@/lib/i18n/urls";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const dynamic = "force-dynamic";

type SitemapSongRow = {
  id: string;
  updated_at: string | null;
  created_at: string;
  is_featured: boolean | null;
  featured_active: boolean | null;
  total_score: number | null;
};

function localizedEntries(path: string, priority: number) {
  return seoLocales.map((locale) => ({
    url: absoluteLocaleUrl(locale, path),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}

function blogEntry(path: string, lastModified: string, priority: number) {
  return {
    url: absoluteLocaleUrl(seoLocales[0], path),
    lastModified: new Date(`${lastModified}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority,
  };
}

async function songEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,updated_at,created_at,is_featured,featured_active,total_score")
    .eq("is_public", true)
    .eq("status", "ready")
    .or("total_score.gte.80,is_featured.eq.true")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return [];
  }

  return (data as SitemapSongRow[])
    .filter(
      (song) =>
        (song.is_featured && song.featured_active !== false) ||
        (song.total_score ?? 0) >= 80,
    )
    .map((song) => ({
      url: `${baseUrl}/song/${song.id}`,
      lastModified: new Date(song.updated_at ?? song.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestBlogDate = blogArticles.reduce(
    (latest, article) =>
      (article.updatedAt ?? article.publishedAt) > latest
        ? (article.updatedAt ?? article.publishedAt)
        : latest,
    "1970-01-01",
  );

  return [
    ...localizedEntries("/", 1),
    ...localizedEntries("/about", 0.75),
    ...SEO_TOOL_PAGE_KEYS.flatMap((key) =>
      localizedEntries(SEO_TOOL_PAGE_PATHS[key], 0.9),
    ),
    ...localizedEntries("/free-ai-lyrics-generator", 0.9),
    ...localizedEntries("/pricing", 0.85),
    blogEntry("/blog", latestBlogDate, 0.75),
    ...blogArticles.map((article) =>
      blogEntry(
        `/blog/${article.slug}`,
        article.updatedAt ?? article.publishedAt,
        0.7,
      ),
    ),
    ...(await songEntries()),
  ];
}

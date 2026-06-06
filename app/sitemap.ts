import type { MetadataRoute } from "next";
import { blogArticles } from "@/config/blog-articles";
import { SEO_TOOL_PAGE_KEYS, SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
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

function blogEntry(path: string, lastModified: string, priority: number) {
  return {
    url: absoluteLocaleUrl(seoLocales[0], path),
    lastModified: new Date(`${lastModified}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority,
  };
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
  ];
}

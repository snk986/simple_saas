import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { blogArticles } from "@/config/blog-articles";
import { defaultLocale, type Locale } from "@/i18n/routing";
import { formatBlogDate } from "@/lib/blog/date";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface BlogPageProps {
  params: Promise<{ locale: Locale }>;
}

const pagePath = "/blog";
const pageTitle = "AI Songwriting Guides & Music Creation Tips | Calyra AI";
const pageDescription =
  "Practical guides for making AI songs from text and lyrics, improving prompts, and understanding royalty-free AI music for creator projects.";

export function generateStaticParams() {
  return [{ locale: defaultLocale }];
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale !== defaultLocale) {
    return { title: "Calyra AI Blog", robots: { index: false, follow: false } };
  }

  const url = absoluteLocaleUrl(defaultLocale, pagePath);
  return buildMarketingMetadata({
    title: pageTitle,
    description: pageDescription,
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(pagePath),
    },
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  if (locale !== defaultLocale) notFound();

  const [featuredArticle, ...articles] = blogArticles;

  return (
    <div className="min-h-screen bg-[#06070a] text-white">
      <section className="border-b border-white/10 bg-[#090a0e]">
        <div className="container px-4 py-12 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-primary">
              <BookOpen className="h-4 w-4" />
              Calyra AI Blog
            </div>
            <h1 className="mt-6 text-4xl font-black leading-none tracking-normal md:text-6xl">
              AI Songwriting Guides
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Learn how to turn ideas and lyrics into songs, write clearer music
              prompts, and make better decisions before publishing your AI
              music.
            </p>
          </div>
        </div>
      </section>

      <main className="container px-4 py-10 md:px-6 md:py-14">
        {featuredArticle && (
          <section>
            <div className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <Sparkles className="h-4 w-4 text-primary" />
              Featured guide
            </div>
            <article className="max-w-4xl rounded-xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-primary">
                  {featuredArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="transition hover:text-primary"
                  >
                    {featuredArticle.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                  {featuredArticle.excerpt}
                </p>
                <div className="mt-5 text-sm text-slate-500">
                  {formatBlogDate(featuredArticle.publishedAt)} ·{" "}
                  {featuredArticle.readingTime}
                </div>
                <Link
                  href={`/blog/${featuredArticle.slug}`}
                  className="mt-7 inline-flex items-center gap-2 font-black text-white transition hover:text-primary"
                >
                  Read the guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </section>
        )}

        {articles.length > 0 && (
          <section className="mt-14">
            <h2 className="text-3xl font-black">Latest guides</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <BlogCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
